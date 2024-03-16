import { STATUS_CODE } from "$std/http/status.ts";
import { defineRoute, Handlers } from "$fresh/server.ts";

import { AdminFormState } from "./_middleware.ts";
import {
  FormParseError,
  parseEditorFormData,
  updateForm,
} from "../../../../utils/form.ts";

import Button from "../../../../components/Button.tsx";
import Checkbox from "../../../../components/Checkbox.tsx";
import TextInput from "../../../../components/TextInput.tsx";
import GrowableTextArea from "../../../../islands/GrowableTextArea.tsx";
import QuestionEditor from "../../../../islands/QuestionEditor.tsx";

export const handler: Handlers<void, AdminFormState> = {
  async POST(req, ctx) {
    const formData = await req.formData();
    try {
      const form = { id: ctx.state.form.id, ...parseEditorFormData(formData) };
      await updateForm(ctx.state.client, form);

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

export default defineRoute<AdminFormState>((_req, { state }) => {
  return (
    <form
      method="post"
      class="flex justify-center p-8 bg-black text-white flex-1 font-sans"
      name={state.form.id}
    >
      <div class="max-w-xl w-full mt-8">
        <div class="flex flex-col space-y-6">
          <TextInput
            name="name"
            label="Form Name"
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
            value={state.form.success_message}
          />
          <div class="flex pt-[0.875rem] items-center">
            <Checkbox name="active" checked={state.form.active} />
            <span class="ml-3 mr-1 text-gray-400 tracking-wide">
              http://../
            </span>
            <TextInput
              name="slug"
              label="Slug"
              value={state.form.slug}
              class="mr-6 max-w-60 -mt-[0.875rem]"
              required
            />
            <Button name="Save" class="ml-auto" />
          </div>
        </div>
      </div>
      {/* Reset the form to prevent Firefox from restoring past unsaved values */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document["${state.form.id}"].reset();`,
        }}
      />
    </form>
  );
});
