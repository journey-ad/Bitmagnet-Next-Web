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
    const { data } = await client.query({
      query: SEARCH,
      variables: {
        query: {
          queryString: keyword,
          limit,
          hasNextPage: true,
          cached: false,
          totalCount: true,
          offset,
        },
      },
    });

    const torrents = { ...data.torrentContent.search };

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

    return NextResponse.json(torrents, {
      status: 200,
    });
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
