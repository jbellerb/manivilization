import { Client } from "postgres/client.ts";

export type Form = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  description?: string;
  questions?: Question[];
  success_message?: string;
};

export type Question = {
  type: "text";
  name: string;
  label: string;
} | {
  type: "checkbox";
  name: string;
  options: string[];
};

export async function listForms(client: Client) {
  const { rows } = await client.queryObject<{ id: string; name: string }>`
    SELECT id, name FROM forms;
  `;

  return rows;
}

export async function createForm(client: Client, form: Form) {
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

export async function getForm(client: Client, id: string) {
  const { rows } = await client.queryObject<Form>`
    SELECT * FROM forms WHERE id = ${id};
  `;
  const form = rows[0];

  if (!form) throw new BadFormError("unknown form");

  return form;
}

export class BadFormError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BadFormError";
  }
}
