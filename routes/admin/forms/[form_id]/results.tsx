import { defineRoute } from "$fresh/server.ts";

import { AdminFormState as State } from "./_middleware.ts";

import ResultsTable from "./(_islands)/ResultsTable.tsx";
import { getFormResponses } from "../../../../utils/form/response.ts";

export default defineRoute<State>(async (_req, { state }) => {
  const questions = state.form.questions?.questions ?? [];
  const responses = await getFormResponses(state.form.id);

  return (
    <div class="overflow-x-auto">
      <ResultsTable
        columns={questions.map((question) => question.name)}
        responses={responses.map((response) => ({
          userId: response.discord_id,
          userName: response.discord_name,
          date: response.date?.getTime() ?? 0,
          response: questions.map((question) =>
            response.response?.[question.name] ?? ""
          ),
        }))}
      />
    </div>
  );
});
