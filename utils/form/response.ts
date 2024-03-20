import { Client } from "postgres/client.ts";

import type { Form, FormResponse } from "./types.ts";
import type { User } from "../discord/user.ts";

export async function createResponse(
  client: Client,
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
      ${new Date()}
    );
  `;
  return id;
}

export async function getResponse(
  client: Client,
  id: string,
): Promise<FormResponse | undefined> {
  const { rows } = await client.queryObject<FormResponse>`
    SELECT * FROM responses WHERE id = ${id};
  `;
  return rows[0];
}

export async function getFormResponses(
  client: Client,
  id: string,
): Promise<FormResponse[]> {
  const { rows } = await client.queryObject<FormResponse>`
    SELECT * FROM responses WHERE form = ${id};
  `;
  return rows;
}
