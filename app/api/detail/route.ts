import { NextResponse } from "next/server";
import { gql } from "@apollo/client";

import client from "@/lib/apolloClient";

// Define the GraphQL query to fetch torrent details by hash
const query = gql`
  query TorrentByHash($hash: String!) {
    torrentByHash(hash: $hash) {
      hash
      name
      size
      magnet_uri
      single_file
      files_count
      files {
        index
        path
        extension
        size
      }
      created_at
      updated_at
    }
  }
`;

// Function to handle GET requests
const handler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");

  // Return a 400 response if the hash parameter is missing
  if (!hash) {
    return NextResponse.json(
      {
        message: "`hash` is required",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  try {
    // Execute the GraphQL query with the provided hash variable
    const { data } = await client.query({
      query,
      variables: { hash },
    });

    // Return a 200 response with the query data
    return NextResponse.json(
      {
        data: data.torrentByHash,
        message: "success",
        status: 200,
      },
      {
        status: 200,
      },
    );
  } catch (error: any) {
    console.error(error);

    // Return a 500 response if there's an error during the query execution
    return NextResponse.json(
      {
        message: error?.message || "Internal Server Error",
        status: 500,
      },
      {
        status: 500,
      },
    );
  }
};

export { handler as GET, handler as POST };
