import { defineLayout } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import type { LayoutConfig } from "$fresh/server.ts";

import AdminButton from "./(_components)/AdminButton.tsx";
import NavItem from "./(_components)/NavItem.tsx";
import db from "../../utils/db/mod.ts";

import { AdminState as State } from "./_middleware.ts";

export const config = {
  skipInheritedLayouts: true,
} satisfies LayoutConfig;

export default defineLayout<State>(async (_req, ctx) => {
  const forms = await db.forms.find({ id: true, name: true }, {
    where: (form, { eq }) => eq(form.instance, ctx.state.instance.id),
  });
  const formId = ctx.params.form_id;

  return (
    <>
      <Head>
        <title>Admin Panel | {ctx.state.instance.name}</title>
      </Head>
      <body class="flex h-screen font-times">
        <aside
          id="sidebar"
          class="flex flex-col w-48 shrink-0 h-full px-3 py-4 border-r border-black"
          aria-label="Sidebar"
        >
          <div class="ml-2">
            <NavItem
              href="/admin"
              text={ctx.state.instance.name}
              highlight={ctx.route === "/admin"}
            />
          </div>
          <hr class="my-4 border-white shadow-box" />
          <nav class="h-full ml-2 overflow-y-auto">
            <ul class="space-y-4 flex flex-col items-start">
              {forms.map(({ id, name }) => (
                <li>
                  <NavItem
                    href={`/admin/forms/${id}`}
                    text={name}
                    highlight={id === formId}
                  />
                </li>
              ))}
            </ul>
          </nav>
          <hr class="my-4 border-white shadow-box" />
          <form class="ml-2" method="post" action="/admin/forms/new">
            <AdminButton name="Create new form" />
          </form>
        </aside>
        <div class="flex flex-col grow h-full overflow-y-auto">
          <ctx.Component />
        </div>
      </body>
    </>
  );
});
