import { QueryClient } from "postgres/client.ts";

import { BadFormError, type Form } from "./types.ts";

export async function listForms(
  client: QueryClient,
): Promise<{ id: Form["id"]; name: Form["name"] }[]> {
  const { rows } = await client.queryObject<{ id: string; name: string }>`
    SELECT id, name FROM forms;
  `;

  return rows;
}

export async function createForm(client: QueryClient, form: Form) {
  await client.queryArray`
    INSERT INTO forms VALUES (
      ${form.id},
      ${form.name},
      ${form.slug},
      ${form.active},
      ${form.description},
      ${form.questions},
      ${form.success_message}
    );
  `;
}

export async function getForm(client: QueryClient, id: string): Promise<Form> {
  const { rows } = await client.queryObject<Form>`
    SELECT * FROM forms WHERE id = ${id};
  `;
  const form = rows[0];

  if (!form) throw new BadFormError("unknown form");
  return form;
}

export async function getFormBySlug(
  client: QueryClient,
  slug: string,
): Promise<Form> {
  const { rows } = await client.queryObject<Form>`
    SELECT * FROM forms WHERE slug = ${slug};
  `;
  const form = rows[0];

  if (!form) throw new BadFormError("unknown form");
  return form;
}

export async function updateForm(client: QueryClient, form: Form) {
  await client.queryArray`
    UPDATE forms SET
      name = ${form.name},
      slug = ${form.slug},
      active = ${form.active},
      description = ${form.description ?? null},
      questions = ${form.questions ?? null},
      success_message = ${form.success_message ?? null}
      WHERE id = ${form.id};
  `;
}
