import { query } from "@/lib/pgdb";
import { jiebaExtract } from "@/lib/jieba";
import { SEARCH_KEYWORD_SPLIT_REGEX } from "@/config/constant";

type Torrent = {
  info_hash: Buffer; // The hash info of the torrent
  name: string; // The name of the torrent
  size: string; // The size of the torrent
  files_count: number; // The count of files in the torrent
  files: TorrentFile[]; // The list of files in the torrent
  created_at: number; // The timestamp when the torrent was created
  updated_at: number; // The timestamp when the torrent was last updated
};

type TorrentFile = {
  index: number; // The index of the file in the torrent
  path: string; // The path of the file in the torrent
  size: string; // The size of the file in the torrent
  extension: string; // The extension of the file
};

const REGEX_PADDING_FILE = /^(_____padding_file_|\.pad\/\d+&)/; // Regular expression to identify padding files

export function formatTorrent(row: Torrent) {
  const hash = row.info_hash.toString("hex"); // Convert info_hash from Buffer to hex string

  return {
    hash: hash,
    name: row.name,
    size: row.size,
    magnet_uri: `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(row.name)}&xl=${row.size}`, // Create magnet URI
    single_file: row.files_count <= 1,
    files_count: row.files_count || 1,
    files: (row.files_count > 0
      ? row.files
      : [
          {
            index: 0,
            path: row.name,
            size: row.size,
            extension: row.name.split(".").pop() || "",
          },
        ]
    )
      .map((file) => ({
        index: file.index,
        path: file.path,
        size: file.size,
        extension: file.extension,
      }))
      .sort((a, b) => {
        // Sorting priority: padding_file lowest -> extension empty next -> ascending index
        const aPadding = REGEX_PADDING_FILE.test(a.path) ? 1 : 0;
        const bPadding = REGEX_PADDING_FILE.test(b.path) ? 1 : 0;

        if (aPadding !== bPadding) {
          return aPadding - bPadding; // padding_file has the lowest priority
        }

        const aNoExtension = !a.extension ? 1 : 0;
        const bNoExtension = !b.extension ? 1 : 0;

        if (aNoExtension !== bNoExtension) {
          return aNoExtension - bNoExtension; // Files with no extension have lower priority
        }

        return a.index - b.index; // Within the same priority, sort by index in ascending order
      }),
    created_at: Math.floor(row.created_at / 1000), // Convert timestamps to seconds
    updated_at: Math.floor(row.updated_at / 1000), // Convert timestamps to seconds
  };
}

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

export async function search(_: any, { queryInput }: any) {
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

    // console.log(sql, params, keywords);

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
}

export async function torrentByHash(_: any, { hash }: { hash: string }) {
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
}

export async function statsInfo() {
  try {
    const sql = `
    WITH db_size AS (
      SELECT pg_database_size('bitmagnet') AS size
    ),
    torrent_count AS (
      SELECT COUNT(*) AS total_count FROM torrents
    ),
    latest_torrent AS (
      SELECT *
        FROM torrents
        ORDER BY created_at DESC
        LIMIT 1
    )
    SELECT 
      db_size.size,
      latest_torrent.created_at as updated_at,
      torrent_count.total_count,
      encode(latest_torrent.info_hash, 'hex') AS latest_torrent_hash,
      json_build_object(
        'hash', encode(latest_torrent.info_hash, 'hex'),
        'name', latest_torrent.name,
        'size', latest_torrent.size,
        'created_at', latest_torrent.created_at,
        'updated_at', latest_torrent.updated_at
      ) AS latest_torrent
    FROM 
      db_size,
      torrent_count,
      latest_torrent;
    `;

    const { rows } = await query(sql, []);
    const data = rows[0];

    if (!data) {
      return null;
    }

    return {
      ...data,
      updated_at: Math.floor(new Date(data.updated_at).getTime() / 1000),
      latest_torrent: {
        ...data.latest_torrent,
        created_at: Math.floor(
          new Date(data.latest_torrent.created_at).getTime() / 1000,
        ),
        updated_at: Math.floor(
          new Date(data.latest_torrent.updated_at).getTime() / 1000,
        ),
      },
    };
  } catch (error) {
    console.error("Error in statsInfo resolver:", error);
    throw new Error("Failed to fetch torrents count");
  }
}
