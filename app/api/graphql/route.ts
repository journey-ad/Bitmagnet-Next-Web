import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next/dist";
import { gql } from "graphql-tag";
import { NextRequest } from "next/server";

import { search, torrentByHash, statsInfo } from "./service";

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

  type statsInfoResult {
    size: String!
    total_count: Int!
    updated_at: Int!
    latest_torrent_hash: String
    latest_torrent: Torrent
  }

  type Query {
    search(queryInput: SearchQueryInput!): SearchResult!
    torrentByHash(hash: String!): Torrent
    statsInfo: statsInfoResult
  }
`;

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      search,
      torrentByHash,
      statsInfo,
    },
  },
});

// req has the type NextRequest
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export { handler as GET, handler as POST };
