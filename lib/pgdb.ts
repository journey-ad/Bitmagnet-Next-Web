import { Pool } from "pg";

// Load connection string from environment
let connectionString = process.env.POSTGRES_DB_URL;

if (!connectionString) {
  const host = process.env.POSTGRES_HOST;
  const password = process.env.POSTGRES_PASSWORD;
  const user = process.env.POSTGRES_USER || "postgres"; // optional, defaults to 'postgres'
  const db = process.env.POSTGRES_DB || "bitmagnet"; // optional, defaults to 'bitmagnet'
  const port = process.env.POSTGRES_PORT || "5432"; // optional, defaults to 5432

  if (!host || !password) {
    // eslint-disable-next-line no-console
    console.warn(
      "Missing environment variables `POSTGRES_DB_URL` or `POSTGRES_HOST` and `POSTGRES_PASSWORD`",
    );
  }

  // Build connection string
  connectionString = `postgres://${user}:${password}@${host}:${port}/${db}`;
}

const pool = new Pool({
  connectionString,
  ssl: false,
});

export const query = (text: string, params: any) => pool.query(text, params);
