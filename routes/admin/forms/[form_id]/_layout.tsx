import { Head } from "$fresh/runtime.ts";
import { defineLayout } from "$fresh/server.ts";

import { AdminFormState as State } from "./_middleware.ts";
import NavItem from "../../(_components)/NavItem.tsx";

export default defineLayout<State>((_req, ctx) => {
  const formId = ctx.params.form_id;

  return (
    <>
      <Head>
        <title>{ctx.state.form.name} | {ctx.state.instance.name}</title>
      </Head>
      <nav class="ml-auto py-4 px-5 space-x-4">
        <NavItem
          href={`/admin/forms/${formId}`}
          text="Edit"
          highlight={ctx.url.pathname === `/admin/forms/${formId}`}
        />
        <NavItem
          href={`/admin/forms/${formId}/results`}
          text="Results"
          highlight={ctx.url.pathname === `/admin/forms/${formId}/results`}
        />
      </nav>
      <ctx.Component />
    </>
  );
});
