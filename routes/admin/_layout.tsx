import { defineLayout, LayoutConfig } from "$fresh/server.ts";

import { AdminState } from "./_middleware.ts";
import classnames from "../../utils/classnames.ts";
import { listForms } from "../../utils/form/form.ts";

export const config: LayoutConfig = {
  skipInheritedLayouts: true,
};

export default defineLayout<AdminState>(async (_req, ctx) => {
  const forms = await listForms(ctx.state.client);
  const formId = ctx.params.form_id;

  return (
    <body class="flex h-screen font-times">
      <aside
        id="sidebar"
        class="flex flex-col w-48 h-full px-3 py-4 border-r border-black"
        aria-label="Sidebar"
      >
        <div class="h-full pl-2 overflow-y-auto">
          <ul class="space-y-4 flex flex-col items-start">
            {forms.map(({ id, name }) => (
              <li>
                <a
                  href={`/admin/forms/${id}`}
                  class={classnames(
                    "border-b border-transparent italic",
                    id === formId
                      ? "text-browser-purple hover:border-browser-purple"
                      : "text-browser-blue hover:border-browser-blue",
                  )}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div class="pt-4 pl-2 mt-4 border-t border-black">
          <a
            href="/admin/forms/new"
            class="text-browser-blue border-b border-transparent hover:border-browser-blue italic"
          >
            Create new form
          </a>
        </div>
      </aside>
      <div class="flex flex-col grow h-full overflow-y-auto">
        <ctx.Component />
      </div>
    </body>
  );
});
