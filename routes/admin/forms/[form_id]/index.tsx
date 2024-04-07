import { STATUS_CODE } from "$std/http/status.ts";
import { defineRoute } from "$fresh/server.ts";

import type { Handlers } from "$fresh/server.ts";

import QuestionEditor from "./(_islands)/QuestionEditor.tsx";
import SlugField from "./(_islands)/SlugField.tsx";
import SubmitterRoleField from "./(_islands)/SubmitterRoleField.tsx";
import Button from "../../../../components/Button.tsx";
import TextInput from "../../../../components/TextInput.tsx";
import GrowableTextArea from "../../../../islands/GrowableTextArea.tsx";
import {
  FormParseError,
  parseEditorFormData,
  updateForm,
} from "../../../../utils/form/mod.ts";

import { AdminFormState as State } from "./_middleware.ts";

export const handler: Handlers<void, State> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    try {
      const form = { id: ctx.state.form.id, ...parseEditorFormData(formData) };
      await updateForm(form);

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
        name={state.form.id}
      >
        <div class="flex flex-col space-y-6">
          <TextInput
            name="name"
            label="Form Name *"
            value={state.form.name}
            class="max-w-md !text-3xl font-bold"
            required
          />
          <GrowableTextArea
            name="description"
            label="Description"
            value={state.form.description}
          />
          <QuestionEditor questions={state.form.questions} />
          <GrowableTextArea
            name="success_message"
            label="Success Message"
            value={state.form.successMessage}
          />
          <div class="flex flex-col items-start">
            <SlugField active={state.form.active} value={state.form.slug} />
            <div class="flex mt-4 w-full items-end content-between">
              <SubmitterRoleField
                class="mr-4"
                submitterRole={state.form.submitterRole}
              />
              <Button name="Save" class="ml-auto" />
            </div>
          </div>
        </div>
      </form>
      {/* Reset the form to prevent Firefox from restoring past unsaved values */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document["${state.form.id}"].reset();`,
        }}
      />
    </main>
  );
});
