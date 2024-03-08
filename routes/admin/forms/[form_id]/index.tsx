import { STATUS_CODE } from "$std/http/status.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

import { State } from "../../_middleware.ts";
import { BadFormError, Form, getForm } from "../../../../utils/form.ts";

import TextArea from "../../../../components/TextArea.tsx";

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
      <div class="max-w-xl w-full mt-6">
        <div class="flex flex-col space-y-10">
          <div class="relative z-0 mt-3">
            <input
              type="text"
              name="name"
              class="block px-0 py-2 bg-transparent text-3xl font-bold border-0 border-b-2 border-gray-600 focus:border-white focus:outline-none focus:ring-0 peer"
              value={props.data.name}
              placeholder=" "
              required
            />
            <label
              for="name"
              class="absolute text-3xl text-gray-400 peer-focus:text-gray-600 font-semibold peer-placeholder-shown:font-bold origin-[0] top-2 -translate-y-7 peer-placeholder-shown:translate-y-0 scale-[47%] peer-placeholder-shown:scale-100 transition -z-10"
            >
              Form Name
            </label>
          </div>
          <TextArea
            name="description"
            label="Description"
            value={props.data.description}
          />
          <TextArea
            name="success_message"
            label="Success message"
            value={props.data.success_message}
          />
          <div class="flex mt-10 items-center">
            <input
              type="checkbox"
              name="active"
              class="w-6 h-6 border-2 checked:border-2 border-gray-600 checked:border-gray-600 hover:checked:border-gray-600 focus:border-white focus:checked:border-white indeterminate:border-gray-600 hover:indeterminate:border-gray-600 focus:indeterminate:border-gray-600 focus:outline-none text-black bg-black active:bg-gray-700 active:checked:bg-gray-700 rounded focus:ring-0 focus:ring-offset-0"
              checked={props.data.active}
            />
            <span class="ml-3 mb-[2px] mr-1 text-gray-400 tracking-wide">
              http://../
            </span>
            <div class="relative z-0">
              <input
                type="text"
                name="slug"
                class="block px-0 py-1 bg-transparent text-lg border-0 border-b-2 border-gray-600 focus:border-white focus:outline-none focus:ring-0 peer"
                value={props.data.slug}
                placeholder=" "
                required
              />
              <label
                for="slug"
                class="absolute text-lg text-gray-400 peer-focus:text-gray-600 font-semibold peer-placeholder-shown:font-normal origin-[0] top-1 -translate-y-6 peer-placeholder-shown:translate-y-0 scale-[78%] peer-placeholder-shown:scale-100 transition -z-10"
              >
                slug
              </label>
            </div>
            <button
              type="submit"
              class="ml-auto px-4 py-1 font-semibold tracking-wide border-2 border-gray-600 focus:border-white active:bg-gray-700 focus-visible:outline-none rounded-full"
            >
              save
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
