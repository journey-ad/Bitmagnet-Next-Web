import { Index, MeiliSearch } from "meilisearch";

const MEILISEARCH_API_URL = process.env.MEILISEARCH_API_URL,
  MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

const meiliClient = {
  enabled: MEILISEARCH_API_URL !== undefined,
  client: null as unknown as MeiliSearch,
  torrents: null as unknown as Index,
};

if (meiliClient.enabled) {
  meiliClient.client = new MeiliSearch({
    host: MEILISEARCH_API_URL as string,
    apiKey: MEILISEARCH_API_KEY,
  });

  meiliClient.torrents = meiliClient.client.index("torrents");
}

export default meiliClient;
