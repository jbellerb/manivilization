import { FreshContext } from "$fresh/server.ts";

import { State } from "./_middleware.ts";
import classnames from "../../utils/classnames.ts";
import { listForms } from "../../utils/form.ts";

export default async function AdminLayout(
  _req: Request,
  ctx: FreshContext<State>,
) {
  const forms = await listForms(ctx.state.ctx.client);
  const formId = ctx.params.form_id;

  return (
    <div class="flex px-3 py-4 h-screen">
      <aside
        id="sidebar"
        class="flex flex-col w-48 h-full flex-col"
        aria-label="Sidebar"
      >
        <div class="h-full overflow-y-auto">
          <ul class="space-y-2">
            {forms.map(({ id, name }) => (
              <li
                class={classnames(
                  "inline-block py-2 ml-2 border-b border-transparent",
                  id === formId
                    ? "text-browser-purple hover:border-browser-purple"
                    : "text-browser-blue hover:border-browser-blue",
                )}
              >
                <a href={`admin/forms/${id}`}>{name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div class="pt-4 mt-4 border-t border-black">
          <button class="py-2 ml-2 text-browser-blue border-b border-transparent hover:border-browser-blue">
            Create new form
          </button>
        </div>
      </aside>

      <div class="w-full pl-3 ml-3 border-l border-black overflow-y-auto">
        <ctx.Component />
      </div>
    </div>
  );
}
