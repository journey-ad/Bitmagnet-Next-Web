import { NextResponse } from "next/server";
import { gql } from "@apollo/client";

import client from "@/utils/apolloClient";

const SEARCH = gql`
  query TorrentContentSearch($query: SearchQueryInput) {
    torrentContent {
      search(query: $query) {
        items {
          hash: infoHash
          torrent {
            hash: infoHash
            name
            size
            magnet_uri: magnetUri
            single_file: singleFile
            files_count: filesCount
            files {
              index
              path
              size
              extension
            }
          }
          created_at: createdAt
          updated_at: updatedAt
        }
        total_count: totalCount
        has_more: hasNextPage
      }
    }
  }
`;

const TOTAL = gql`
  query TorrentContentSearch($query: SearchQueryInput) {
    torrentContent {
      search(query: $query) {
        items {
          torrent {
            hash: infoHash
          }
        }
      }
    }
  }
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const offset = Number(searchParams.get("offset")) || 0;
  const limit = Number(searchParams.get("limit")) || 20;

  if (!keyword) {
    return NextResponse.json(
      {
        message: "keyword is required",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const query = {
      queryString: keyword,
      hasNextPage: false,
      cached: true,
      totalCount: false,
      offset: 0,
    };

    const reqArr = [
      client.query({
        query: SEARCH,
        variables: {
          query: {
            ...query,
            limit,
            offset,
          },
        },
      }),
      client.query({
        query: TOTAL,
        variables: {
          query: {
            ...query,
            limit: 1000, // 默认返回的total_count不准确，先用这种方法代替
          },
        },
      }),
    ];

    const [respData, respTotal] = await Promise.all(reqArr);

    const torrents = { ...respData.data.torrentContent.search };
    const total = respTotal.data.torrentContent.search.items.length;

    torrents.items = torrents.items.map((item: any) => {
      const result = {
        ...item.torrent,
        ...item,
        created_at: (new Date(item.created_at).getTime() / 1000) | 0,
        updated_at: (new Date(item.updated_at).getTime() / 1000) | 0,
      };

      delete result.torrent;

      return result;
    });

    torrents.total_count = total;

    return NextResponse.json(
      {
        data: torrents,
        message: "success",
        status: 200,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: error,
        status: 500,
      },
      {
        status: 500,
      },
    );
  }
}
