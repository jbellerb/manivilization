import { sql } from "../db/mod.ts";

import type { Form } from "../db/schema.ts";
import type { User } from "../discord/user.ts";

export async function createResponse(
  form: Form,
  user: User,
  response: object,
): Promise<string> {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO responses VALUES (
      ${id},
      ${form.id},
      ${user.id},
      ${response},
      ${new Date()},
      ${user.username}
    )
  `;
  return id;
}
