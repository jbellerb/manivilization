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
    <div class="flex h-screen">
      <aside
        id="sidebar"
        class="flex flex-col w-48 h-full px-3 py-4 border-r border-black"
        aria-label="Sidebar"
      >
        <div class="h-full overflow-y-auto">
          <ul class="space-y-2 flex flex-col">
            {forms.map(({ id, name }) => (
              <li
                class={classnames(
                  "inline-block pt-2 pb-1 ml-2 border-b border-transparent italic",
                  id === formId
                    ? "text-browser-purple hover:border-browser-purple"
                    : "text-browser-blue hover:border-browser-blue",
                )}
              >
                <a href={`/admin/forms/${id}`}>{name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div class="pt-4 mt-4 border-t border-black">
          <a
            href="/admin/forms/new"
            class="ml-2 text-browser-blue border-b border-transparent hover:border-browser-blue italic"
          >
            Create new form
          </a>
        </div>
      </aside>
      <div class="flex flex-col grow h-full overflow-y-auto">
        <ctx.Component />
      </div>
    </div>
  );
}
