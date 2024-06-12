# Bitmagnet-Next-Web

A more modern magnet search website program, developed using [Next.js 14](https://nextjs.org/docs/getting-started) + [NextUI v2](https://nextui.org/), with the backend powered by [Bitmagnet](https://github.com/bitmagnet-io/bitmagnet).

![Index](.readme/en_Index.png)

![Search](.readme/en_Search.png)

## Deployment Instructions

### Container Deployment

The most convenient way to deploy is using Docker Compose. Refer to the docker-compose.yml configuration below:

```yaml
services:
  bitmagnet-next-web:
    image: journey-ad/bitmagnet-next-web:latest
    container_name: bitmagnet-next-web
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - POSTGRES_DB_URL=postgres://postgres:postgres@localhost:5432/bitmagnet
      # - POSTGRES_HOST=postgres
      # - POSTGRES_PASSWORD=postgres
    depends_on:
      postgres:
        condition: service_healthy

  bitmagnet:
    image: ghcr.io/bitmagnet-io/bitmagnet:latest
    container_name: bitmagnet
    ports:
      # API and WebUI port:
      - "3333:3333"
      # BitTorrent ports:
      - "3334:3334/tcp"
      - "3334:3334/udp"
    restart: unless-stopped
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_PASSWORD=postgres
      # - TMDB_API_KEY=your_api_key
    command:
      - worker
      - run
      - --keys=http_server
      - --keys=queue_server
      # disable the next line to run without DHT crawler
      - --keys=dht_crawler
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    container_name: bitmagnet-postgres
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    #    ports:
    #      - "5432:5432" Expose this port if you'd like to dig around in the database
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=bitmagnet
      - PGUSER=postgres
    shm_size: 1g
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready
      start_period: 20s
      interval: 10s
```

### Running with docker run

If not using Docker Compose, you can run each container separately using the following commands:

1. Run the PostgreSQL container:

```bash
docker run -d \
  --name bitmagnet-postgres \
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
  -p 3333:3333 \
  -p 3334:3334/tcp \
  -p 3334:3334/udp \
  -e POSTGRES_HOST=bitmagnet-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e TMDB_API_KEY=your_api_key \
  ghcr.io/bitmagnet-io/bitmagnet:latest

```

3. Run the Bitmagnet-Next-Web container:

```bash
docker run -d \
  --name bitmagnet-next-web \
  -p 3000:3000 \
  -e POSTGRES_DB_URL=postgres://postgres:postgres@localhost:5432/bitmagnet \
  journey-ad/bitmagnet-next-web:latest

```

### Full-Text Search Optimization

The search capability relies on the torrents.name and torrent_files.path columns. The original Bitmagnet does not index these columns, so it's recommended to create indexes to improve query efficiency:

```sql
create extension pg_trgm; -- Enable pg_trgm extension

-- Create indexes on `torrents.name` and `torrent_files.path`
CREATE INDEX idx_torrents_name_1 ON torrents USING gin (name gin_trgm_ops);
CREATE INDEX idx_torrent_files_path_1 ON torrent_files USING gin (path gin_trgm_ops);
```

## Development Guide

Before starting development, create a `.env.local` file in the project root directory and fill in the environment variables:

```bash
BITMAGNET_DB_URL=postgres://postgres:postgres@localhost:5432/bitmagnet
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
