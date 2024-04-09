import { defineLayout } from "$fresh/server.ts";

import NavItem from "../../(_components)/NavItem.tsx";

export default defineLayout((_req, { Component, params, url }) => {
  const formId = params.form_id;

  return (
    <>
      <nav class="ml-auto py-4 px-5 space-x-4">
        <NavItem
          href={`/admin/forms/${formId}`}
          text="Edit"
          highlight={url.pathname === `/admin/forms/${formId}`}
        />
        <NavItem
          href={`/admin/forms/${formId}/results`}
          text="Results"
          highlight={url.pathname === `/admin/forms/${formId}/results`}
        />
      </nav>
      <Component />
    </>
  );
});
