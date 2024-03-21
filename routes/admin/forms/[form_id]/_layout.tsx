import { defineLayout } from "$fresh/server.ts";

import classnames from "../../../../utils/classnames.ts";

type LinkProps = {
  active: boolean;
  href: string;
  text: string;
};

function Link(props: LinkProps) {
  return (
    <a
      class={classnames(
        "inline border-b border-transparent italic",
        props.active
          ? "text-browser-purple hover:border-browser-purple"
          : "text-browser-blue hover:border-browser-blue",
      )}
      href={props.href}
    >
      {props.text}
    </a>
  );
}

export default defineLayout((_req, { Component, params, url }) => {
  const formId = params.form_id;

  return (
    <>
      <nav class="ml-auto py-4 px-5 space-x-4">
        <Link
          active={url.pathname === `/admin/forms/${formId}`}
          href={`/admin/forms/${formId}`}
          text="Edit"
        />
        <Link
          active={url.pathname === `/admin/forms/${formId}/results`}
          href={`/admin/forms/${formId}/results`}
          text="Results"
        />
      </nav>
      <Component />
    </>
  );
});
