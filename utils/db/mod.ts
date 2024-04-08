import { setupRepository } from "./repository.ts";
import { AuthSession, Form, FormResponse, Session } from "./schema.ts";
import sql from "./sql.ts";

import type { FormSpec } from "../form/types.ts";

export default {
  authSessions: setupRepository(AuthSession),
  sessions: setupRepository(Session),
  forms: setupRepository(Form<FormSpec>),
  responses: setupRepository(FormResponse),
  sql,
};
