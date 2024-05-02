import { toSnowflake } from "../discord/snowflake.ts";

import type { Form, FormResponse } from "../db/schema.ts";

export function updateRoles(
  currentRoles: bigint[],
  responses: {
    form: Pick<Form, "questions" | "submitterRole">;
    response: FormResponse["response"];
  }[],
): bigint[] {
  const guildRoles = new Set(currentRoles);

  for (let i = responses.length - 1; i >= 0; i--) {
    const form = responses[i].form;
    if (form.submitterRole) guildRoles.add(form.submitterRole);
    for (const question of form.questions?._ ?? []) {
      if (question.type === "checkbox_roles") {
        question.options
          .forEach(({ role }) => guildRoles.delete(toSnowflake(role)));
        const selected = responses[i].response?.[question.name]?.split(", ");
        question.options.forEach(({ label, role }) =>
          selected?.includes(label) && guildRoles.add(toSnowflake(role))
        );
      }
    }
  }

  return Array.from(guildRoles);
}
