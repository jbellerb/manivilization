import sql from "../db.ts";
import { BadFormError } from "./types.ts";

import type { Form } from "./types.ts";

export async function listForms(): Promise<
  { id: Form["id"]; name: Form["name"] }[]
> {
  return await sql`
    SELECT id, name FROM forms
  `;
}

export async function createForm(form: Form) {
  await sql`
    INSERT INTO forms VALUES (
      ${form.id},
      ${form.name},
      ${form.slug},
      ${form.active},
      ${form.description},
      ${form.questions},
      ${form.success_message},
      ${form.submitter_role}
    )
  `;
}

export async function getForm(id: string): Promise<Form> {
  const [form]: [Form?] = await sql`
    SELECT * FROM forms WHERE id = ${id}
  `;

  if (!form) throw new BadFormError("unknown form");
  return form;
}

export async function getFormBySlug(
  slug: string,
): Promise<Form> {
  const [form]: [Form?] = await sql`
    SELECT * FROM forms WHERE slug = ${slug}
  `;

  if (!form) throw new BadFormError("unknown form");
  return form;
}

export async function updateForm(form: Form) {
  await sql`
    UPDATE forms SET
      name = ${form.name},
      slug = ${form.slug},
      active = ${form.active},
      description = ${form.description ?? null},
      questions = ${form.questions ?? null},
      success_message = ${form.success_message ?? null},
      submitter_role = ${form.submitter_role ?? null}
      WHERE id = ${form.id}
  `;
}
