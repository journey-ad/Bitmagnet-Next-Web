# Bitmagnet-Next-Web

<img src=".readme/Logo.svg" width="200" height="200" align="center" alt="Bitmagnet-Next-Web" />

更现代的磁力搜索网站程序，使用 [Next.js 14](https://nextjs.org/docs/getting-started) + [NextUI v2](https://nextui.org/) 开发，后端使用 [Bitmagnet](https://github.com/bitmagnet-io/bitmagnet)

![Index](.readme/zh_Index.png)

![Search](.readme/zh_Search.png)

## 部署说明

### 容器部署

最方便的部署方式是用 Docker Compose，参考下面 docker-compose.yml 配置

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

### 使用 docker run 运行

如果不使用 Docker Compose，可以使用以下命令分别运行各个容器：

1. 运行 PostgreSQL 容器：

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

2. 运行 Bitmagnet 容器：

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

3. 运行 Bitmagnet-Next-Web 容器：

```bash
docker run -d \
  --name bitmagnet-next-web \
  -p 3000:3000 \
  -e POSTGRES_DB_URL=postgres://postgres:postgres@localhost:5432/bitmagnet \
  journey-ad/bitmagnet-next-web:latest
```

### 全文搜索优化

搜索能力依赖 `torrents.name` 和 `torrent_files.path` 两列数据，原版 Bitmagnet 未对此建立索引，建议先建立索引提升查询效率：

```sql
create extension pg_trgm; -- 启用 pg_trgm 扩展

-- 对 `torrents.name` 和 `torrent_files.path` 建立索引
CREATE INDEX idx_torrents_name_1 ON torrents USING gin (name gin_trgm_ops);
CREATE INDEX idx_torrent_files_path_1 ON torrent_files USING gin (path gin_trgm_ops);
```

## 开发指引

开始开发之前，需要在项目根目录创建一个 `.env.local` 文件，并填写环境变量：

```bash
# .env.local
POSTGRES_DB_URL=postgres://postgres:postgres@localhost:5432/bitmagnet
```

推荐使用 `pnpm` 作为包管理器

### 安装依赖

```bash
pnpm install
```

### 开发环境运行

```bash
pnpm run dev
```

### 打包 & 部署

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

## 免责声明

- 本程序为免费开源项目，旨在方便对 Bitmagnet 程序的索引数据进行检索和重新排版，以及学习 Next.js 开发，本程序不涉及采集、存储和下载功能；
- 本程序仅用于学习和研究，不得用于商业用途，使用时请遵守相关法律法规，不得侵犯任何第三方的知识产权；
- 本程序不提供任何支持或保证，由使用者自身滥用本程序导致的一切后果均由使用者自行承担。使用者对本程序的使用即表示接受并同意本声明。
