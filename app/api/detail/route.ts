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
  const hash = searchParams.get("hash");

  if (!hash) {
    return NextResponse.json(
      {
        message: "hash is required",
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
          queryString: hash,
          limit: 1,
          hasNextPage: false,
          cached: true,
          totalCount: false,
          offset: 0,
        },
      },
    });

    const item = { ...data.torrentContent.search.items[0] };

    const result = {
      ...item.torrent,
      ...item,
      created_at: (new Date(item.created_at).getTime() / 1000) | 0,
      updated_at: (new Date(item.updated_at).getTime() / 1000) | 0,
    };

    delete result.torrent;

    return NextResponse.json(
      {
        data: result,
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
