import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

import { State } from "../../_middleware.ts";
import { BadFormError, Form, getForm } from "../../../../utils/form.ts";

import TextInput from "../../../../components/TextInput.tsx";
import GrowableTextArea from "../../../../islands/GrowableTextArea.tsx";
import QuestionEditor from "../../../../islands/QuestionEditor.tsx";

export const handler: Handlers<Form, State> = {
  async GET(_req, ctx) {
    try {
      const form = await getForm(ctx.state.ctx.client, ctx.params.form_id);
      return await ctx.render(form);
    } catch (e) {
      if (e instanceof BadFormError) return ctx.renderNotFound();
      throw e;
    }
  },
  async POST(req, _ctx) {
    console.log(await req.formData());

    const { pathname } = new URL(req.url);
    const headers = new Headers({ Location: pathname });
    return new Response(null, { status: STATUS_CODE.Found, headers });
  },
};

export default function FormEditor(props: PageProps<Form>) {
  return (
    <form
      method="post"
      class="flex justify-center p-8 bg-black text-white flex-1 font-sans"
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
            <input
              type="checkbox"
              name="active"
              class="w-6 h-6 bg-black border-2 checked:border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded transition-border-color"
              checked={props.data.active}
            />
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
            <button
              type="submit"
              class="ml-auto px-4 py-1 font-semibold tracking-wide border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
