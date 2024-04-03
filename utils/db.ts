import { Pool } from "postgres/pool.ts";

import { DATABASE_URL } from "./env.ts";

const MAX_DB_CONNECTIONS = 15;

export const db = new Pool(
  DATABASE_URL,
  MAX_DB_CONNECTIONS,
  true,
);
