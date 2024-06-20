import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next/dist";
import { gql } from "graphql-tag";
import { NextRequest } from "next/server";

import { formatTorrent } from "./service";

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
    torrents: [Torrent!]!
    total_count: Int!
    has_more: Boolean!
  }

  type Query {
    search(queryInput: SearchQueryInput!): SearchResult!
    torrentByHash(hash: String!): Torrent
  }
`;

// Define Resolvers
const resolvers = {
  Query: {
    search: async (_: any, { queryInput }: any) => {
      // Return an empty result if no keywords are provided
      if (queryInput.keyword.trim().length < 2) {
        return {
          torrents: [],
          total_count: 0,
          has_more: false,
        };
      }

      // Determine the order by clause based on the sortType
      const orderByMap: { [key: string]: string } = {
        size: "torrents.size DESC",
        count: "COALESCE(torrents.files_count, 0) DESC",
        date: "torrents.created_at ASC",
      };
      const orderBy =
        orderByMap[queryInput.sortType] || "torrents.created_at DESC";

      // Determine the time filter based on the filterTime
      const timeFilterMap: { [key: string]: string } = {
        "gt-1day": "AND torrents.created_at > now() - interval '1 day'",
        "gt-7day": "AND torrents.created_at > now() - interval '1 week'",
        "gt-31day": "AND torrents.created_at > now() - interval '1 month'",
        "gt-365day": "AND torrents.created_at > now() - interval '1 year'",
      };
      const timeFilter = timeFilterMap[queryInput.filterTime] || "";

      // Determine the size filter based on the filterSize
      const sizeFilterMap: { [key: string]: string } = {
        lt100mb: "AND torrents.size < 100 * 1024 * 1024::bigint",
        "gt100mb-lt500mb":
          "AND torrents.size BETWEEN 100 * 1024 * 1024::bigint AND 500 * 1024 * 1024::bigint",
        "gt500mb-lt1gb":
          "AND torrents.size BETWEEN 500 * 1024 * 1024::bigint AND 1024 * 1024 * 1024::bigint",
        "gt1gb-lt5gb":
          "AND torrents.size BETWEEN 1 * 1024 * 1024 * 1024::bigint AND 5 * 1024 * 1024 * 1024::bigint",
        gt5gb: "AND torrents.size > 5 * 1024 * 1024 * 1024::bigint",
      };
      const sizeFilter = sizeFilterMap[queryInput.filterSize] || "";

      // Extract and process keywords
      const keywords = Array.from(
        new Set(
          queryInput.keyword
            .trim()
            .split(SEARCH_KEYWORD_SPLIT_REGEX)
            .filter((k: string) => k.trim().length >= 2),
        ),
      );

      // Construct the keyword filter condition
      let keywordFilter = `torrents.name ILIKE $1`;

      if (keywords.length > 0) {
        keywordFilter += ` OR ${keywords
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
          LIMIT $${keywords.length + 2}    -- 返回数量
          OFFSET $${keywords.length + 3}   -- 分页偏移
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
        `%${queryInput.keyword}%`,
        ...keywords.map((k: any) => `%${k}%`),
        queryInput.limit,
        queryInput.offset,
      ];

      // console.log(sql, params);

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
        const countParams = [
          `%${queryInput.keyword}%`,
          ...keywords.map((k: any) => `%${k}%`),
        ];

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

      return { torrents, total_count, has_more };
    },
    torrentByHash: async (_: any, { hash }: any) => {
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
