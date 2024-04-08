import { BadFormError } from "./types.ts";
import db from "../db/mod.ts";

import type { FormSpec } from "./types.ts";
import type { Form } from "../db/schema.ts";

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
