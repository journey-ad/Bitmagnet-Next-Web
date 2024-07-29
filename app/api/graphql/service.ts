import { query } from "@/lib/pgdb";
import { jiebaCut } from "@/lib/jieba";
import meiliClient from "@/lib/meilisearch";
import { SEARCH_KEYWORD_SPLIT_REGEX } from "@/config/constant";
import { getTimestamp } from "@/utils/index";

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

  const generateSingleFiles = (row: Torrent) => {
    return [
      {
        index: 0,
        path: row.name,
        size: row.size,
        extension: row.name.split(".").pop() || "",
      },
    ];
  };

  return {
    hash: hash,
    name: row.name,
    size: row.size,
    magnet_uri: `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(row.name)}&xl=${row.size}`, // Create magnet URI
    single_file: row.files_count <= 1,
    files_count: row.files_count || 1,
    files: (row.files_count > 0 ? row.files : generateSingleFiles(row))
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
const buildOrderBy = (sortType: "size" | "count" | "date") => {
  const orderByMap = {
    size: "torrents.size DESC",
    count: "COALESCE(torrents.files_count, 0) DESC",
    date: "torrents.created_at ASC",
  };

  return orderByMap[sortType] || "torrents.created_at DESC";
};

const buildTimeFilter = (
  filterTime: "gt-1day" | "gt-7day" | "gt-31day" | "gt-365day",
) => {
  const timeFilterMap = {
    "gt-1day": "AND torrents.created_at > now() - interval '1 day'",
    "gt-7day": "AND torrents.created_at > now() - interval '1 week'",
    "gt-31day": "AND torrents.created_at > now() - interval '1 month'",
    "gt-365day": "AND torrents.created_at > now() - interval '1 year'",
  };

  return timeFilterMap[filterTime] || "";
};

const buildSizeFilter = (
  filterSize:
    | "lt100mb"
    | "gt100mb-lt500mb"
    | "gt500mb-lt1gb"
    | "gt1gb-lt5gb"
    | "gt5gb",
) => {
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

// Build Meili Sort
const buildMeiliSort = (sortType: "size" | "count" | "date") => {
  const sortMap = {
    size: "size:desc",
    count: "files_count:desc",
    date: "created_at:asc",
  };

  const sort = [sortMap[sortType] || "created_at:desc"];

  console.log(sort);

  return sort;
};
// Build Meili Filter
const buildMeiliFilter = (queryInput: any) => {
  const { sortType, filterTime, filterSize } = queryInput;

  let filterList = [];

  switch (filterTime) {
    case "gt-1day":
      filterList.push(`created_at > ${getTimestamp(-1, "day")}`);
      break;
    case "gt-7day":
      filterList.push(`created_at > ${getTimestamp(-7, "day")}`);
      break;
    case "gt-31day":
      filterList.push(`created_at > ${getTimestamp(-1, "month")}`);
      break;
    case "gt-365day":
      filterList.push(`created_at > ${getTimestamp(-1, "year")}`);
      break;
  }

  switch (filterSize) {
    case "lt100mb":
      filterList.push(`size < ${100 * 1024 * 1024}`);
      break;
    case "gt100mb-lt500mb":
      filterList.push(
        `size >= ${100 * 1024 * 1024} AND size < ${500 * 1024 * 1024}`,
      );
      break;
    case "gt500mb-lt1gb":
      filterList.push(
        `size >= ${500 * 1024 * 1024} AND size < ${1 * 1024 * 1024 * 1024}`,
      );
      break;
    case "gt1gb-lt5gb":
      filterList.push(
        `size >= ${1 * 1024 * 1024 * 1024} AND size < ${5 * 1024 * 1024 * 1024}`,
      );
      break;
    case "gt5gb":
      filterList.push(`size >= ${5 * 1024 * 1024 * 1024}`);
      break;
  }

  if (!filterList.length) return [];

  const filter = [filterList.join(" AND ")];

  console.log(filter);

  return filter;
};

const QUOTED_KEYWORD_REGEX = /"([^"]+)"/g;
const extractKeywords = (
  keyword: string,
): { keyword: string; required: boolean }[] => {
  let keywords = [];
  let match;

  // Extract exact keywords using quotation marks
  while ((match = QUOTED_KEYWORD_REGEX.exec(keyword)) !== null) {
    keywords.push({ keyword: match[1], required: true });
  }

  const remainingKeywords = keyword.replace(QUOTED_KEYWORD_REGEX, "");

  // Extract remaining keywords using regex tokenizer
  keywords.push(
    ...remainingKeywords
      .trim()
      .split(SEARCH_KEYWORD_SPLIT_REGEX)
      .map((k) => ({ keyword: k, required: false })),
  );

  // Use jieba to words segment if input is a full sentence
  if (keywords.length === 1 && keyword.length >= 4) {
    keywords.push(...jiebaCut(keyword));
  }

  // Remove duplicates and filter out keywords shorter than 2 characters to avoid slow SQL queries
  keywords = Array.from(
    new Map(keywords.map((k) => [k.keyword, k])).values(),
  ).filter(({ keyword }) => keyword.trim().length >= 2);

  // Ensure at least 1/3 keyword is required when there is no required keyword
  if (keywords.length && !keywords.some(({ required }) => required)) {
    [...keywords]
      .sort((a, b) => b.keyword.length - a.keyword.length)
      .slice(0, Math.ceil(keywords.length / 3))
      .forEach((k) => (k.required = true));
  }

  const fullKeyword = keyword.replace(/"/g, "");

  // Ensure full keyword is the first item
  if (!keywords.some((k) => k.keyword === fullKeyword)) {
    keywords.unshift({ keyword: fullKeyword, required: false });
  }

  return keywords;
};

const dbsearch = async ({ queryInput }: any) => {
  // Build SQL conditions and parameters
  const orderBy = buildOrderBy(queryInput.sortType);
  const timeFilter = buildTimeFilter(queryInput.filterTime);
  const sizeFilter = buildSizeFilter(queryInput.filterSize);

  const keywords = extractKeywords(queryInput.keyword);

  // Construct the keyword filter condition
  const requiredKeywords: string[] = [];
  const optionalKeywords: string[] = [];

  keywords.forEach(({ required }, i) => {
    const condition = `torrents.name ILIKE $${i + 1}`;

    if (required) {
      requiredKeywords.push(condition);
    } else {
      optionalKeywords.push(condition);
    }
  });

  const fullConditions = [...requiredKeywords];

  if (optionalKeywords.length > 0) {
    optionalKeywords.push("TRUE");
    fullConditions.push(`(${optionalKeywords.join(" OR ")})`);
  }

  const keywordFilter = fullConditions.join(" AND ");

  const keywordsParams = keywords.map(({ keyword }) => `%${keyword}%`);
  const keywordsPlain = keywords.map(({ keyword }) => keyword);

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
    ${timeFilter}   -- 时间范围过滤条件
    ${sizeFilter}   -- 大小范围过滤条件
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

  const params = [...keywordsParams, queryInput.limit, queryInput.offset];

  console.debug("SQL:", sql, params);
  console.debug(
    "keywords:",
    keywords.map((item, i) => ({ _: `$${i + 1}`, ...item })),
  );

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
    const countParams = [...keywordsParams];

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

  return { keywords: keywordsPlain, torrents, total_count, has_more };
};

// invisible characters for highlighting
const _MARK_TAG = ["\u200b\u200c", "\u200b\u200d"];
// regex to extract keywords from name
const _MARK_TAG_RE = new RegExp(`${_MARK_TAG[0]}(.*?)${_MARK_TAG[1]}`, "g");
const meilisearch = async ({ queryInput }: any) => {
  const { keyword, limit, offset, sortType } = queryInput;

  const search = await meiliClient.torrents.search(keyword, {
    offset,
    limit,
    sort: buildMeiliSort(sortType),
    filter: buildMeiliFilter(queryInput),
    attributesToSearchOn: ["name"],
    attributesToRetrieve: ["info_hash", "name"],
    attributesToHighlight: ["name"],
    highlightPreTag: _MARK_TAG[0],
    highlightPostTag: _MARK_TAG[1],
  });

  const { hits, estimatedTotalHits: total_count } = search;

  const hashes = hits.map((item: any) => item.info_hash as string);
  const torrents = await torrentByHashBatch(null, { hashes });

  const has_more =
    queryInput.withTotalCount &&
    queryInput.offset + queryInput.limit < total_count;

  const keywordsSet = hits.reduce(
    (acc: Set<string>, item) => {
      const { name } = item._formatted || {};

      // extract keywords from name
      if (name) {
        [...name.matchAll(_MARK_TAG_RE)].forEach((match) => {
          const [_, keyword] = match;

          if (keyword.length > 1 || !/[a-zA-Z0-9]/.test(keyword)) {
            acc.add(keyword);
          }
        });
      }

      return acc;
    },
    new Set<string>([keyword]),
  );

  return { keywords: [...keywordsSet], torrents, total_count, has_more };
};

const searchResolver = async ({ queryInput }: any) => {
  // meilisearch resolver
  if (meiliClient.enabled) {
    return meilisearch({ queryInput });
  } else {
    return dbsearch({ queryInput });
  }
};

export async function search(_: any, { queryInput }: any) {
  try {
    console.info("-".repeat(50));
    console.info("search params", queryInput);

    // trim keyword
    queryInput.keyword = queryInput.keyword.trim();

    const no_result = {
      keywords: [queryInput.keyword],
      torrents: [],
      total_count: 0,
      has_more: false,
    };

    // Return an empty result if no keywords are provided
    if (queryInput.keyword.length < 2) {
      return no_result;
    }

    const REGEX_HASH = /^[a-f0-9]{40}$/;

    if (REGEX_HASH.test(queryInput.keyword)) {
      const torrent = await torrentByHash(_, { hash: queryInput.keyword });

      if (torrent) {
        return {
          keywords: [queryInput.keyword],
          torrents: [torrent],
          total_count: 1,
          has_more: false,
        };
      }

      return no_result;
    }

    return searchResolver({ queryInput });
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

export async function torrentByHashBatch(
  _: any,
  { hashes }: { hashes: string[] },
) {
  try {
    const byteaHashes = hashes.map((hash) => Buffer.from(hash, "hex"));

    // SQL query to fetch torrent data and files information by hash
    const sql = `
SELECT
  t.info_hash,
  t.name,
  t.size,
  t.created_at,
  t.updated_at,
  t.files_count,
  (
    SELECT json_agg(json_build_object(
      'index', f.index,
      'path', f.path,
      'size', f.size,
      'extension', f.extension
    ))
    FROM torrent_files f
    WHERE f.info_hash = t.info_hash
  ) AS files
FROM torrents t
WHERE t.info_hash = ANY($1)
GROUP BY t.info_hash;
    `;

    const params = [byteaHashes];

    const { rows } = await query(sql, params);
    const torrents = rows.map(formatTorrent).sort((a, b) => {
      return hashes.indexOf(a.hash) > hashes.indexOf(b.hash) ? 1 : -1;
    });

    return torrents;
  } catch (error) {
    console.error("Error in torrentByHashBatch resolver:", error);
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
