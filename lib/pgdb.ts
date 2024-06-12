import { Pool } from "pg";

const connectionString = process.env.BITMAGNET_DB_URL;

if (!connectionString) {
  throw new Error("Missing environment variable `BITMAGNET_DB_URL`");
}

const pool = new Pool({
  connectionString,
  ssl: false,
});

export const query = (text: string, params: any) => pool.query(text, params);
