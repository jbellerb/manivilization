import { SELF, useCSP } from "$fresh/runtime.ts";

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
    });

    return ctx.render({ questions, responses });
  },
};

export default function ResultsPage({ data }: PageProps<Data, State>) {
  useCSP((csp) => {
    csp.directives.imgSrc = [SELF];
    csp.directives.styleSrc = [SELF];
  });

  return (
    <div class="overflow-x-auto px-2 pb-2">
      <ResultsTable
        columns={data.questions.map((question) => question.name)}
        responses={data.responses.map((response) => ({
          userId: fromSnowflake(response.discordId),
          userName: response.discordName,
          date: response.date?.getTime() ?? 0,
          response: data.questions.map((question) =>
            response.response?.[question.name] ?? ""
          ),
        }))}
      />
    </div>
  );
}
