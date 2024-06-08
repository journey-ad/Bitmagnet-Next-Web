import { ApolloClient, InMemoryCache, from, HttpLink } from "@apollo/client";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URI, // 从环境变量中获取 URI
});

const removeTypename = removeTypenameFromVariables();

const client = new ApolloClient({
  cache: new InMemoryCache({
    addTypename: false,
  }),
  link: from([removeTypename, httpLink]),
});

export default client;
