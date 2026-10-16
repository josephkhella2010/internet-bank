import "dotenv/config";
import pg from "pg";
import { env } from "./env.ts";

const { Pool } = pg;

const pool = new Pool({
  user: env.POSTGRES_USER,
  host: env.POSTGRES_HOST,
  database: env.POSTGRES_DB,
  password: env.POSTGRES_PASSWORD,
  port: Number(env.POSTGRES_PORT),
});

export default pool;