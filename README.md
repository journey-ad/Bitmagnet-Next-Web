<div align="center">
<img src=".readme/Logo.svg" width="100" height="100" alt="Bitmagnet-Next-Web" />

<h1>Bitmagnet-Next-Web</h1>

A more modern magnet search website program, developed using [Next.js 14](https://nextjs.org/docs/getting-started) + [NextUI v2](https://nextui.org/), with the backend powered by [Bitmagnet](https://github.com/bitmagnet-io/bitmagnet).

![Index](.readme/en_Index.jpg)
![Search](.readme/en_Search.jpg)

</div>

## Deployment Instructions

### Container Deployment

The most convenient way to deploy is using Docker Compose. Refer to the [docker-compose.yml](./docker-compose.yml)

### Running with docker run

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
