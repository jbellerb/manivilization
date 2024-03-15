import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

import { AdminState } from "../../_middleware.ts";
import {
  BadFormError,
  Form,
  FormParseError,
  getForm,
  parseFormData,
  updateForm,
} from "../../../../utils/form.ts";

import Button from "../../../../components/Button.tsx";
import Checkbox from "../../../../components/Checkbox.tsx";
import TextInput from "../../../../components/TextInput.tsx";
import GrowableTextArea from "../../../../islands/GrowableTextArea.tsx";
import QuestionEditor from "../../../../islands/QuestionEditor.tsx";

export const handler: Handlers<Form, AdminState> = {
  async GET(_req, ctx) {
    try {
      const form = await getForm(ctx.state.client, ctx.params.form_id);
      return await ctx.render(form);
    } catch (e) {
      if (e instanceof BadFormError) return ctx.renderNotFound();
      throw e;
    }
  },
  async POST(req, ctx) {
    const formData = await req.formData();
    try {
      const form = { id: ctx.params.form_id, ...parseFormData(formData) };
      await updateForm(ctx.state.client, form);

      const { pathname } = new URL(req.url);
      const headers = new Headers({ Location: pathname });
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

export default (props: PageProps<Form>) => {
  return (
    <form
      method="post"
      class="flex justify-center p-8 bg-black text-white flex-1 font-sans"
      name={props.data.id}
    >
      <div class="max-w-xl w-full mt-8">
        <div class="flex flex-col space-y-6">
          <TextInput
            name="name"
            label="Form Name"
            value={props.data.name}
            class="max-w-md !text-3xl font-bold"
            required
          />
          <GrowableTextArea
            name="description"
            label="Description"
            value={props.data.description}
          />
          <QuestionEditor questions={props.data.questions} />
          <GrowableTextArea
            name="success_message"
            label="Success Message"
            value={props.data.success_message}
          />
          <div class="flex pt-[0.875rem] items-center">
            <Checkbox name="active" checked={props.data.active} />
            <span class="ml-3 mr-1 text-gray-400 tracking-wide">
              http://../
            </span>
            <TextInput
              name="slug"
              label="Slug"
              value={props.data.slug}
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
          __html: `document["${props.data.id}"].reset();`,
        }}
      />
    </form>
  );
};
