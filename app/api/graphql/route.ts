import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next/dist";
import { gql } from "graphql-tag";
import { NextRequest } from "next/server";

import { formatTorrent } from "./service";

import { jiebaExtract } from "@/lib/jieba";
import { query } from "@/lib/pgdb";
import { SEARCH_KEYWORD_SPLIT_REGEX } from "@/config/constant";

// Define GraphQL Schema
const typeDefs = gql`
  type TorrentFile {
    index: Int
    path: String
    extension: String
    size: String
  }

  type Torrent {
    hash: String!
    name: String!
    size: String!
    magnet_uri: String!
    single_file: Boolean!
    files_count: Int!
    files: [TorrentFile!]!
    created_at: Int!
    updated_at: Int!
  }

  input SearchQueryInput {
    keyword: String!
    offset: Int!
    limit: Int!
    sortType: String
    filterTime: String
    filterSize: String
    withTotalCount: Boolean
  }

  type SearchResult {
    keywords: [String!]!
    torrents: [Torrent!]!
    total_count: Int!
    has_more: Boolean!
  }

  type Query {
    search(queryInput: SearchQueryInput!): SearchResult!
    torrentByHash(hash: String!): Torrent
  }
`;

// Utility functions for query building
const buildOrderBy = (sortType: keyof typeof orderByMap) => {
  const orderByMap = {
    size: "torrents.size DESC",
    count: "COALESCE(torrents.files_count, 0) DESC",
    date: "torrents.created_at ASC",
  };

  return orderByMap[sortType] || "torrents.created_at DESC";
};

const buildTimeFilter = (filterTime: keyof typeof timeFilterMap) => {
  const timeFilterMap = {
    "gt-1day": "AND torrents.created_at > now() - interval '1 day'",
    "gt-7day": "AND torrents.created_at > now() - interval '1 week'",
    "gt-31day": "AND torrents.created_at > now() - interval '1 month'",
    "gt-365day": "AND torrents.created_at > now() - interval '1 year'",
  };

  return timeFilterMap[filterTime] || "";
};

const buildSizeFilter = (filterSize: keyof typeof sizeFilterMap) => {
  const sizeFilterMap = {
    lt100mb: "AND torrents.size < 100 * 1024 * 1024::bigint",
    "gt100mb-lt500mb":
      "AND torrents.size BETWEEN 100 * 1024 * 1024::bigint AND 500 * 1024 * 1024::bigint",
    "gt500mb-lt1gb":
      "AND torrents.size BETWEEN 500 * 1024 * 1024::bigint AND 1024 * 1024 * 1024::bigint",
    "gt1gb-lt5gb":
      "AND torrents.size BETWEEN 1 * 1024 * 1024 * 1024::bigint AND 5 * 1024 * 1024 * 1024::bigint",
    gt5gb: "AND torrents.size > 5 * 1024 * 1024 * 1024::bigint",
  };

  return sizeFilterMap[filterSize] || "";
};

const QUOTED_KEYWORD_REGEX = /"([^"]+)"/g;
const extractKeywords = (keyword: string): string[] => {
  let keywords = [];
  let match;

  // Extract exact keywords using quotation marks
  while ((match = QUOTED_KEYWORD_REGEX.exec(keyword)) !== null) {
    keywords.push(match[1]);
  }

  const remainingKeywords = keyword.replace(QUOTED_KEYWORD_REGEX, "");

  // Extract remaining keywords using regex tokenizer
  keywords.push(...remainingKeywords.trim().split(SEARCH_KEYWORD_SPLIT_REGEX));

  // Use jieba to words segment if input is a full sentence
  if (keywords.length === 1 && keyword.length >= 4) {
    keywords.push(...jiebaExtract(keyword));
  }

  const fullKeyword = keyword.replace(/"/g, "");

  // Ensure full keyword is the first item
  if (!keywords.includes(fullKeyword)) {
    keywords.unshift(fullKeyword);
  }

  // Remove duplicates and filter out keywords shorter than 2 characters to avoid slow SQL queries
  return Array.from(new Set(keywords.filter((k) => k.trim().length >= 2)));
};

// Define Resolvers
const resolvers = {
  Query: {
    search: async (_: any, { queryInput }: any) => {
      try {
        // Return an empty result if no keywords are provided
        if (queryInput.keyword.trim().length < 2) {
          return {
            torrents: [],
            total_count: 0,
            has_more: false,
          };
        }

        // Build SQL conditions and parameters
        const orderBy = buildOrderBy(queryInput.sortType);
        const timeFilter = buildTimeFilter(queryInput.filterTime);
        const sizeFilter = buildSizeFilter(queryInput.filterSize);

        const keywords = extractKeywords(queryInput.keyword);

        // Construct the keyword filter condition
        // The full keyword (first item) is handled separately
        let keywordFilter = `torrents.name ILIKE $1`;

        // Combine remaining keywords with `AND`, then with full keyword using `OR`
        // Ensures the full keyword matches first, followed by individual tokens
        if (keywords.length > 1) {
          keywordFilter += ` OR ${keywords
            .slice(1)
            .map((_: any, i: number) => `torrents.name ILIKE $${i + 2}`)
            .join(" AND ")}`;
        }

        // SQL query to fetch filtered torrent data and files information
        const sql = `
        -- 先查到符合过滤条件的数据
        WITH filtered AS (
          SELECT 
            torrents.info_hash,    -- 种子哈希
            torrents.name,         -- 种子名称
            torrents.size,         -- 种子大小
            torrents.created_at,   -- 创建时间戳
            torrents.updated_at,   -- 更新时间戳
            torrents.files_count   -- 种子文件数
          FROM 
            torrents
          WHERE 
            (${keywordFilter})   -- 关键词过滤条件
            ${timeFilter}      -- 时间范围过滤条件
            ${sizeFilter}      -- 大小范围过滤条件
          ${orderBy ? `ORDER BY ${orderBy}` : ""} -- 排序方式
          LIMIT $${keywords.length + 1}    -- 返回数量
          OFFSET $${keywords.length + 2}   -- 分页偏移
        )
        -- 从过滤后的数据中查询文件信息
        SELECT 
          filtered.info_hash,    -- 种子哈希
          filtered.name,         -- 种子名称
          filtered.size,         -- 种子大小
          filtered.created_at,   -- 创建时间戳
          filtered.updated_at,   -- 更新时间戳
          filtered.files_count,  -- 种子文件数
          -- 检查 files_count, 是否有文件数量
          CASE
            WHEN filtered.files_count IS NOT NULL THEN (
              -- 如果有数量, 根据 info_hash 查询文件信息到 'files' 列, 聚合成JSON
              SELECT json_agg(json_build_object(
                'index', torrent_files.index,         -- 文件在种子中的索引
                'path', torrent_files.path,           -- 文件在种子中的路径
                'size', torrent_files.size,           -- 文件大小
                'extension', torrent_files.extension  -- 文件扩展名
              ))
              FROM torrent_files
              WHERE torrent_files.info_hash = filtered.info_hash   -- 根据 info_hash 匹配文件
            )
            ELSE NULL   -- 如果 files_count 为空, 则设置为NULL
          END AS files  -- 结果别名设为 'files'
        FROM 
          filtered;   -- 从过滤后的数据中查询
        `;

        const params = [
          ...keywords.map((k: any) => `%${k}%`),
          queryInput.limit,
          queryInput.offset,
        ];

        console.log(sql, params, keywords);

        const queryArr = [query(sql, params)];

        // SQL query to get the total count if requested
        if (queryInput.withTotalCount) {
          const countSql = `
          SELECT COUNT(*) AS total
          FROM (
            SELECT 1
            FROM torrents
            WHERE
              (${keywordFilter})
              ${timeFilter}
              ${sizeFilter}
          ) AS limited_total;
        `;
          const countParams = [...keywords.map((k: any) => `%${k}%`)];

          queryArr.push(query(countSql, countParams));
        } else {
          queryArr.push(Promise.resolve({ rows: [{ total: 0 }] }) as any);
        }

        // Execute queries and process results
        const [{ rows: torrentsResp }, { rows: countResp }] =
          await Promise.all(queryArr);

        const torrents = torrentsResp.map(formatTorrent);
        const total_count = countResp[0].total;

        const has_more =
          queryInput.withTotalCount &&
          queryInput.offset + queryInput.limit < total_count;

        return { keywords, torrents, total_count, has_more };
      } catch (error) {
        console.error("Error in search resolver:", error);
        throw new Error("Failed to execute search query");
      }
    },
    torrentByHash: async (_: any, { hash }: any) => {
      try {
        // SQL query to fetch torrent data and files information by hash
        const sql = `
        SELECT
          t.info_hash,
          t.name,
          t.size,
          t.created_at,
          t.updated_at,
          t.files_count,
          json_agg(json_build_object(
            'index', f.index,
            'path', f.path,
            'size', f.size,
            'extension', f.extension
          )) AS files
        FROM torrents t
        LEFT JOIN torrent_files f ON t.info_hash = f.info_hash
        WHERE t.info_hash = decode($1, 'hex')
        GROUP BY t.info_hash, t.name, t.size, t.created_at, t.updated_at, t.files_count;
        `;

        const params = [hash];

        const { rows } = await query(sql, params);
        const torrent = rows[0];

        if (!torrent) {
          return null;
        }

        return formatTorrent(torrent);
      } catch (error) {
        console.error("Error in torrentByHash resolver:", error);
        throw new Error("Failed to fetch torrent by hash");
      }
    },
  },
};

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// req has the type NextRequest
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export { handler as GET, handler as POST };
