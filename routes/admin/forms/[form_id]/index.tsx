import { STATUS_CODE } from "$std/http/status.ts";
import { defineRoute } from "$fresh/server.ts";

import type { Handlers } from "$fresh/server.ts";

import QuestionEditor from "./(_islands)/QuestionEditor.tsx";
import SlugField from "./(_islands)/SlugField.tsx";
import SubmitterRoleField from "./(_islands)/SubmitterRoleField.tsx";
import Button from "../../../../components/Button.tsx";
import FormResetter from "../../../../islands/FormResetter.tsx";
import GrowableTextArea from "../../../../islands/GrowableTextArea.tsx";
import ValidatedTextInput from "../../../../islands/ValidatedTextInput.tsx";
import db from "../../../../utils/db/mod.ts";
import { fromSnowflake } from "../../../../utils/discord/snowflake.ts";
import {
  FormParseError,
  parseEditorFormData,
} from "../../../../utils/form/parse.ts";

import { AdminFormState as State } from "./_middleware.ts";

export const handler: Handlers<void, State> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    try {
      Object.assign(ctx.state.form, parseEditorFormData(formData));
      await db.forms.update(ctx.state.form);

      const headers = new Headers({
        Location: `/admin/forms/${ctx.state.form.id}`,
      });
      return new Response(null, { status: STATUS_CODE.Found, headers });
    } catch (e) {
      if (e instanceof FormParseError) {
        console.log(e);
        return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
      }
      throw e;
    }
  },
};

export default defineRoute<State>((_req, { state }) => {
  return (
    <main class="flex justify-center px-8 py-16 bg-black text-white flex-1 font-sans">
      <form
        method="post"
        class="max-w-xl w-full"
        name={state.form.slug}
      >
        <div class="flex flex-col space-y-6">
          <ValidatedTextInput
            name="name"
            label="Form Name *"
            value={state.form.name}
            class="max-w-md !text-3xl font-bold"
            required
          />
          <GrowableTextArea
            name="description"
            label="Description"
            value={state.form.description ?? undefined}
          />
          <QuestionEditor questions={state.form.questions?._} />
          <GrowableTextArea
            name="success_message"
            label="Success Message"
            value={state.form.successMessage ?? undefined}
          />
          <div class="flex flex-col items-start">
            <SlugField active={state.form.active} value={state.form.slug} />
            <div class="flex mt-4 w-full items-end content-between">
              <SubmitterRoleField
                class="mr-4"
                submitterRole={state.form.submitterRole == null
                  ? undefined
                  : fromSnowflake(state.form.submitterRole)}
              />
              <Button name="Save" class="ml-auto" />
            </div>
          </div>
        </div>
      </form>
      <FormResetter form={state.form.slug} />
    </main>
  );
});
