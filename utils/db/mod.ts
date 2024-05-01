import { setupRepository } from "./repository.ts";
import * as schema from "./schema.ts";
import sql from "./sql.ts";

export * from "./schema.ts";
export type { EntityJoined } from "./entity.ts";

export default {
  instances: setupRepository(schema.Instance),
  authSessions: setupRepository(schema.AuthSession),
  sessions: setupRepository(schema.Session),
  forms: setupRepository(schema.Form),
  responses: setupRepository(schema.FormResponse),
  sql,
};
