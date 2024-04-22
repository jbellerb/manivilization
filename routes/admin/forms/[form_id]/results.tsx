import { SELF, STRICT_DYNAMIC, useCSP } from "$fresh/runtime.ts";

import type { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";

import ResultsTable from "./(_islands)/ResultsTable.tsx";
import { AdminFormState as State } from "./_middleware.ts";
import db from "../../../../utils/db/mod.ts";
import { fromSnowflake } from "../../../../utils/discord/snowflake.ts";

import type { FormResponse } from "../../../../utils/db/schema.ts";
import type { Question } from "../../../../utils/form/types.ts";

type Data = {
  questions: Question[];
  responses: FormResponse[];
};

export const config: RouteConfig = {
  csp: true,
};

export const handler: Handlers<Data, State> = {
  async GET(_req, ctx) {
    const questions = ctx.state.form.questions?._ ?? [];
    const responses = await db.responses.find({}, {
      where: (response, { eq }) => eq(response.form, ctx.state.form.id),
      orderBy: (response, { desc }) => desc(response.date),
    });

    return ctx.render({ questions, responses });
  },
};

export default function ResultsPage({ data }: PageProps<Data, State>) {
  useCSP((csp) => {
    csp.directives.imgSrc = [SELF];
    csp.directives.scriptSrc = [STRICT_DYNAMIC];
    csp.directives.styleSrc = [SELF];
  });

  type User = Parameters<typeof ResultsTable>[0]["users"][number];
  const users: Record<string, User> = {};
  for (const response of data.responses) {
    const id = fromSnowflake(response.discordId);
    users[id] ??= { id, name: response.discordName, responses: [] };
    users[id].responses = [...users[id].responses, {
      date: response.date?.getTime() ?? 0,
      response: data.questions.map((question) =>
        response.response?.[question.name] ?? ""
      ),
      rolesSet: response.rolesSet,
    }];
  }

  return (
    <div class="overflow-x-auto">
      <ResultsTable
        columns={data.questions.map((question) => question.name)}
        users={Object.values(users)}
      />
    </div>
  );
}
