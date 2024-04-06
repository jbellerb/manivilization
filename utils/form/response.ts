import sql from "../db.ts";

import type { Form, FormResponse } from "./types.ts";
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

export async function getResponse(
  id: string,
): Promise<FormResponse | undefined> {
  const [response]: [FormResponse?] = await sql`
    SELECT * FROM responses WHERE id = ${id}
  `;
  return response;
}

export async function getFormResponses(
  formId: string,
): Promise<FormResponse[]> {
  return await sql`
    SELECT * FROM responses WHERE form = ${formId}
  `;
}

export async function getUserFormResponses(
  formId: string,
  userId: string,
): Promise<FormResponse[]> {
  return await sql`
    SELECT * FROM responses WHERE form = ${formId} AND discord_id = ${userId}
        ORDER BY date DESC
  `;
}
