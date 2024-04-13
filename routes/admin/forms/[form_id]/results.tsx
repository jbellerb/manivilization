import { defineRoute } from "$fresh/server.ts";

import { AdminFormState as State } from "./_middleware.ts";

import ResultsTable from "./(_islands)/ResultsTable.tsx";
import db from "../../../../utils/db/mod.ts";
import { fromSnowflake } from "../../../../utils/discord/snowflake.ts";

export default defineRoute<State>(async (_req, { state }) => {
  const questions = state.form.questions?._ ?? [];
  const responses = await db.responses.find({}, {
    where: (response, { eq }) => eq(response.form, state.form.id),
  });

  return (
    <div class="overflow-x-auto">
      <ResultsTable
        columns={questions.map((question) => question.name)}
        responses={responses.map((response) => ({
          userId: fromSnowflake(response.discordId),
          userName: response.discordName,
          date: response.date?.getTime() ?? 0,
          response: questions.map((question) =>
            response.response?.[question.name] ?? ""
          ),
        }))}
      />
    </div>
  );
});
