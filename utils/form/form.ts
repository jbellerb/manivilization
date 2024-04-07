import { BadFormError } from "./types.ts";
import db, { sql } from "../db/mod.ts";

import type { FormSpec } from "./types.ts";
import type { Form } from "../db/schema.ts";

export async function createForm(form: Form) {
  await sql`
    INSERT INTO forms VALUES (
      ${form.id},
      ${form.name},
      ${form.slug},
      ${form.active},
      ${form.description},
      ${form.questions},
      ${form.successMessage},
      ${form.submitterRole}
    )
  `;
}

export async function getForm(id: string): Promise<Form<FormSpec>> {
  const form = await db.forms.findOne({}, {
    where: (form, { eq }) => eq(form.id, id),
  });

  if (!form) throw new BadFormError("unknown form");
  return form;
}

export async function getFormBySlug(slug: string): Promise<Form<FormSpec>> {
  const form = await db.forms.findOne({}, {
    where: (form, { eq }) => eq(form.slug, slug),
  });

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
      success_message = ${form.successMessage ?? null},
      submitter_role = ${form.submitterRole ?? null}
      WHERE id = ${form.id}
  `;
}
