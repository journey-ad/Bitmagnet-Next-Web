import { NextResponse } from "next/server";
import { gql } from "@apollo/client";

import client from "@/lib/apolloClient";

// Define the GraphQL query to fetch torrent details by hash
const query = gql`
  query StatsInfo {
    statsInfo {
      size
      total_count
      updated_at
      latest_torrent_hash
      latest_torrent {
        hash
        name
        size
        created_at
        updated_at
      }
    }
  }
`;

// Function to handle GET requests
const handler = async () => {
  try {
    // Execute the GraphQL query with the provided hash variable
    const { data } = await client.query({ query, fetchPolicy: "no-cache" });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Return a 200 response with the query data
    return NextResponse.json(
      {
        data: data.statsInfo,
        message: "success",
        status: 200,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
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
