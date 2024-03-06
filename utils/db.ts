import { Pool } from "postgres/pool.ts";

const MAX_DB_CONNECTIONS = 15;

export const db = new Pool(
  Deno.env.get("DATABASE_URL"),
  MAX_DB_CONNECTIONS,
  true,
);
