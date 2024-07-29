<div align="center">
<img src=".readme/Logo.svg" width="100" height="100" alt="Bitmagnet-Next-Web" />

<h1>Bitmagnet-Next-Web</h1>

English / [中文文档](./README_zh-CN.md)

A more modern magnet search website program, developed using [Next.js 14](https://nextjs.org/docs/getting-started) + [NextUI v2](https://nextui.org/), with the backend powered by [Bitmagnet](https://github.com/bitmagnet-io/bitmagnet).

![Index](.readme/en_Index.jpg)
![Search](.readme/en_Search.jpg)

</div>

## Deployment Instructions

### Container Deployment

The most convenient way to deploy is using Docker Compose. Refer to the [docker-compose.yml](./docker-compose.yml)

#### Run Docker Container Manually

If not using Docker Compose, you can run each container separately using the following commands:

1. Run the PostgreSQL container:

```bash
docker run -d \
  --name bitmagnet-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bitmagnet \
  -e PGUSER=postgres \
  -v ./data/postgres:/var/lib/postgresql/data \
  --shm-size=1g \
  postgres:16-alpine
```

2. Run the Bitmagnet container:

```bash
docker run -d \
  --name bitmagnet \
  --link bitmagnet-postgres:postgres \
  -p 3333:3333 \
  -p 3334:3334/tcp \
  -p 3334:3334/udp \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PASSWORD=postgres \
  ghcr.io/bitmagnet-io/bitmagnet:latest \
  worker run --keys=http_server --keys=queue_server --keys=dht_crawler
```

3. Run the Bitmagnet-Next-Web container:

```bash
docker run -d \
  --name bitmagnet-next-web \
  --link bitmagnet-postgres:postgres \
  -p 3000:3000 \
  -e POSTGRES_DB_URL=postgres://postgres:postgres@postgres:5432/bitmagnet \
  journey0ad/bitmagnet-next-web:latest
```

### Full-Text Search Optimization

The search capability relies on the `torrents.name` and `torrent_files.path` columns. The original Bitmagnet does not index these columns, so it's recommended to create indexes to improve query efficiency:

```sql
create extension pg_trgm; -- Enable pg_trgm extension

-- Create indexes on `torrents.name` and `torrent_files.path`
CREATE INDEX idx_torrents_name_1 ON torrents USING gin (name gin_trgm_ops);
CREATE INDEX idx_torrent_files_path_1 ON torrent_files USING gin (path gin_trgm_ops);
```

### (Optional) Enhanced Search with Meilisearch

After running bitmagnet for several months, the database size may reach tens of millions of records, making standard gin indexing less effective. To improve query performance, consider using [Meilisearch](https://github.com/meilisearch/meilisearch) as a full-text search engine. Properly configured, it can respond to queries across tens of millions of records within a few hundred milliseconds.

Refer to the Meilisearch [installation guide](https://www.meilisearch.com/docs/learn/getting_started/installation#local-installation) for deployment. For data synchronization, see the official meilisync PostgreSQL [guide](https://www.meilisearch.com/docs/guides/database/meilisync_postgresql).

> [!NOTE]  
> meilisync requires the `wal2json` plugin for PostgreSQL and `wal_level=logical` logging. See the [Dockerfile](https://gist.github.com/journey-ad/77096356f2d65ecd6259b8546f39a1d6) for reference.
>
> If bitmagnet has been running for a while, it is recommended to pause crawler tasks and perform a full data sync, which may take some time. Without pausing, transactions during the full sync will be recorded in the wal logs, possibly consuming significant disk space.

To enable search filtering and sorting, set `filterableAttributes` for:
- `created_at`
- `size`

And `sortableAttributes` for:
- `created_at`
- `files_count`
- `size`

Finally, configure the following environment variables in Bitmagnet-Next-Web to enable Meilisearch enhanced search:
- `MEILISEARCH_API_URL`: Meilisearch instance URL
- `MEILISEARCH_API_KEY`: Meilisearch instance API Key

#### Meilisearch Configuration Reference
```json
{
  ...
  "filterableAttributes": [
    "created_at",
    "size"
  ],
  "sortableAttributes": [
    "created_at",
    "files_count",
    "size"
  ],
  ...
}
```

#### meilisync Configuration Reference
```yaml
debug: false
meilisearch:
  api_url: http://meilisearch:7700/ # Meilisearch instance URL
  api_key: 'master_key' # Meilisearch instance master_key
  insert_size: 1000
  insert_interval: 10
progress:
  type: file
  path: './progress.json' # Save sync progress, create an empty JSON file in the specified directory beforehand, or meilisync will error
source:
  type: postgres # Specify database type
  host: postgres # Database host
  port: 5432 # Database port
  database: bitmagnet # Database name
  user: postgres # Connection username
  password: postgres # Connection password
sync:
  - table: torrents # Sync torrents table to Meilisearch
    pk: info_hash # Set primary key to info_hash
    full: true # Enable full sync
    fields: # Fields to sync
      info_hash:
      name:
      size:
      files_count:
      extension:
      created_at:
      updated_at:
```

## Development Guide

Before starting development, create a `.env.local` file in the project root directory and fill in the environment variables:

```bash
# .env.local
POSTGRES_DB_URL=postgres://postgres:postgres@localhost:5432/bitmagnet
```

It's recommended to use `pnpm` as the package manager.

### Install Dependencies

```bash
pnpm install
```

### Run Development Environment

```bash
pnpm run dev
```

### Build & Deploy

```bash
pnpm run build
pnpm run serve
```

## Credits

- [Bitmagnet](https://github.com/bitmagnet-io/bitmagnet)
- [Next.js](https://nextjs.org/)
- [NextUI](https://nextui.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Fluent Emoji](https://github.com/microsoft/fluentui-emoji)

## License

Licensed under the [MIT license](./LICENSE).
