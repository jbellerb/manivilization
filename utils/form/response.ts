import { QueryClient } from "postgres/client.ts";

import type { Form, FormResponse } from "./types.ts";
import type { User } from "../discord/user.ts";

export async function createResponse(
  client: QueryClient,
  form: Form,
  user: User,
  response: object,
): Promise<string> {
  const id = crypto.randomUUID();
  await client.queryArray`
    INSERT INTO responses VALUES (
      ${id},
      ${form.id},
      ${user.id},
      ${response},
      ${new Date()},
      ${user.username}
    );
  `;
  return id;
}

export async function getResponse(
  client: QueryClient,
  id: string,
): Promise<FormResponse | undefined> {
  const { rows } = await client.queryObject<FormResponse>`
    SELECT * FROM responses WHERE id = ${id};
  `;
  return rows[0];
}

export async function getFormResponses(
  client: QueryClient,
  formId: string,
): Promise<FormResponse[]> {
  const { rows } = await client.queryObject<FormResponse>`
    SELECT * FROM responses WHERE form = ${formId};
  `;
  return rows;
}

export async function getUserFormResponses(
  client: QueryClient,
  formId: string,
  userId: string,
): Promise<FormResponse[]> {
  const { rows } = await client.queryObject<FormResponse>`
    SELECT * FROM responses WHERE form = ${formId} AND discord_id = ${userId}
        ORDER BY date DESC;
  `;
  return rows;
}
