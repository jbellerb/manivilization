import { setupRepository } from "./repository.ts";
import * as schema from "./schema.ts";
import sql from "./sql.ts";

import type { FormSpec } from "../form/types.ts";

export * from "./schema.ts";

export default {
  authSessions: setupRepository(schema.AuthSession),
  sessions: setupRepository(schema.Session),
  forms: setupRepository(schema.Form<FormSpec>),
  responses: setupRepository(schema.FormResponse),
  sql,
};
