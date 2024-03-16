import { defineRoute } from "$fresh/server.ts";

import { AdminFormState } from "./_middleware.ts";
import { getFormResponses } from "../../../../utils/form.ts";

import ResultsTable from "../../../../islands/ResultsTable.tsx";

export default defineRoute<AdminFormState>(async (_req, { state }) => {
  const questions = state.form.questions?.questions ?? [];
  const responses = await getFormResponses(state.client, state.form.id);

  return (
    <div class="overflow-x-auto">
      <ResultsTable
        columns={questions.map((question) => question.name)}
        responses={responses.map((response) => ({
          user: response.discord_id,
          date: response.date?.getTime() ?? 0,
          response: questions.map((question) =>
            response.response?.[question.name] ?? ""
          ),
        }))}
      />
    </div>
  );
});
