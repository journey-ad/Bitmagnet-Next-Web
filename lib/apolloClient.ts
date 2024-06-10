import { ApolloClient, InMemoryCache, from, HttpLink } from "@apollo/client";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename";

import { getBaseUrl } from "@/utils/api";

const httpLink = new HttpLink({
  uri: `${getBaseUrl()}/api/graphql`, // 从环境变量中获取 URI
});

const removeTypename = removeTypenameFromVariables();

const client = new ApolloClient({
  cache: new InMemoryCache({
    addTypename: false,
  }),
  link: from([removeTypename, httpLink]),
});

export default client;
