import postgres from "postgresjs/mod.js";

import type { Notice, Options } from "postgresjs/types/index.d.ts";

import { setupRepository } from "./repository.ts";
import { AuthSession, Form, FormResponse, Session } from "./schema.ts";

import type { FormSpec } from "../form/types.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

export let notice: Notice | undefined;
const options: Options<Record<string, never>> = {
  idle_timeout: 20,
  max_lifetime: 5 * 60,
  onnotice: (n) => {
    console.warn(n);
    notice = n;
  },
};

export const sql = DATABASE_URL
  ? postgres(DATABASE_URL, options)
  : postgres(options);

const db = {
  authSessions: setupRepository(sql, AuthSession),
  sessions: setupRepository(sql, Session),
  forms: setupRepository(sql, Form<FormSpec>),
  responses: setupRepository(sql, FormResponse),
};
export default db;
