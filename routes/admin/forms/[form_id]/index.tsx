import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

import { State } from "../../_middleware.ts";
import { BadFormError, Form, getForm } from "../../../../utils/form.ts";

import GrowableTextArea from "../../../../islands/GrowableTextArea.tsx";

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
        <div class="flex flex-col space-y-4">
          <div class="relative z-0 pt-3">
            <input
              type="text"
              name="name"
              class="block px-0 py-2 bg-transparent text-3xl font-bold border-0 border-b-2 border-gray-600 hover:border-gray-500 focus-visible:border-white transition-border-color focus-visible:outline-none peer"
              value={props.data.name}
              placeholder=" "
              required
            />
            <label
              for="name"
              class="absolute text-sm font-semibold text-gray-400 peer-focus-visible:text-gray-600 origin-[0] top-0 transition-color -z-10"
            >
              Form Name
            </label>
          </div>
          <GrowableTextArea
            name="description"
            label="Description"
            value={props.data.description}
          />
          <GrowableTextArea
            name="success_message"
            label="Success message"
            value={props.data.success_message}
          />
          <div class="flex pt-[0.875rem] items-center">
            <input
              type="checkbox"
              name="active"
              class="w-6 h-6 bg-black border-2 checked:border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded transition-border-color focus-visible:outline-none"
              checked={props.data.active}
            />
            <span class="ml-3 mr-1 text-gray-400 tracking-wide">
              http://../
            </span>
            <div class="relative mt-[0.125rem] z-0">
              <input
                type="text"
                name="slug"
                class="block px-0 py-1 bg-transparent text-lg border-0 border-b-2 border-gray-600 hover:border-gray-500 focus-visible:border-white transition-border-color focus-visible:outline-none peer"
                value={props.data.slug}
                placeholder=" "
                required
              />
              <label
                for="slug"
                class="absolute text-sm text-gray-400 peer-focus-visible:text-gray-600 font-semibold origin-[0] -top-4 transition-color -z-10"
              >
                slug
              </label>
            </div>
            <button
              type="submit"
              class="ml-auto px-4 py-1 font-semibold tracking-wide border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white focus-visible:outline-none rounded-full transition-border-color"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
