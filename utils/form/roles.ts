import { toSnowflake } from "../discord/snowflake.ts";

import type { Form, FormResponse } from "../db/schema.ts";

export function assignableRoles(form: Form): bigint[] {
  const roles: bigint[] = [];

  if (form.submitterRole) roles.push(form.submitterRole);
  for (const question of form.questions?._ ?? []) {
    if (question.type === "checkbox_roles") {
      question.options.forEach(({ role }) => roles.push(toSnowflake(role)));
    }
  }

  return roles;
}

export function neededRoles(
  form: Form,
  response: FormResponse["response"],
): bigint[] {
  const roles: bigint[] = [];

  if (form.submitterRole) roles.push(form.submitterRole);
  for (const question of form.questions?._ ?? []) {
    if (question.type === "checkbox_roles") {
      const selected = response?.[question.name]?.split(", ");
      question.options.forEach(({ label, role }) =>
        selected?.includes(label) && roles.push(toSnowflake(role))
      );
    }
  }

  return roles;
}
