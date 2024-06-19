import { NextResponse } from "next/server";
import { gql } from "@apollo/client";
import { z } from "zod";

import client from "@/lib/apolloClient";
import {
  SEARCH_PARAMS,
  SEARCH_KEYWORD_LENGTH_MIN,
  SEARCH_KEYWORD_LENGTH_MAX,
  SEARCH_PAGE_SIZE,
  DEFAULT_SORT_TYPE,
  DEFAULT_FILTER_TIME,
  DEFAULT_FILTER_SIZE,
} from "@/config/constant";

// GraphQL query to search for torrents
const SEARCH = gql`
  query Search($queryInput: SearchQueryInput!) {
    search(queryInput: $queryInput) {
      torrents {
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
      total_count
      has_more
    }
  }
`;

// Define the schema for the request parameters using Zod
const schema = z.object({
  keyword: z
    .string()
    .min(SEARCH_KEYWORD_LENGTH_MIN)
    .max(SEARCH_KEYWORD_LENGTH_MAX),
  offset: z.coerce.number().min(0).default(0),
  limit: z.coerce
    .number()
    .min(1)
    .max(SEARCH_PAGE_SIZE)
    .default(SEARCH_PAGE_SIZE),
  sortType: z.enum(SEARCH_PARAMS.sortType).default(DEFAULT_SORT_TYPE),
  filterTime: z.enum(SEARCH_PARAMS.filterTime).default(DEFAULT_FILTER_TIME),
  filterSize: z.enum(SEARCH_PARAMS.filterSize).default(DEFAULT_FILTER_SIZE),
  withTotalCount: z.coerce.boolean().default(false),
});

const handler = async (request: Request) => {
  // Extract search parameters from the request URL
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  let safeParams;

  // Validate and parse the parameters using Zod schema
  try {
    safeParams = schema.parse(params);
  } catch (error: any) {
    console.error(error);

    const { path, message } = error.errors[0] || {};
    const errMessage = path ? `${path[0]}: ${message}` : message;

    return NextResponse.json(
      {
        data: null,
        message: errMessage || "Invalid request",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  // Perform the search query using Apollo Client
  try {
    const { data } = await client.query({
      query: SEARCH,
      variables: {
        queryInput: safeParams,
      },
      fetchPolicy: "no-cache",
    });

    return NextResponse.json(
      {
        data: data.search,
        message: "success",
        status: 200,
      },
      {
        status: 200,
      },
    );
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        data: null,
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
