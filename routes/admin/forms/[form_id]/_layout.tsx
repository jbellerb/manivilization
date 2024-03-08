import { PageProps } from "$fresh/server.ts";

import classnames from "../../../../utils/classnames.ts";

function LinkButton(props: { active: boolean; href: string; text: string }) {
  return (
    <a
      class={classnames(
        "mx-2 border-b border-transparent italic",
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

export default function FormLayout({ Component, params, url }: PageProps) {
  const formId = params.form_id;

  return (
    <div class="flex flex-col w-full h-full overflow-y-auto">
      <div class="flex py-4 px-3 justify-end">
        <LinkButton
          active={url.pathname === `/admin/forms/${formId}`}
          href={`/admin/forms/${formId}`}
          text="Edit"
        />
        <LinkButton
          active={url.pathname === `/admin/forms/${formId}/results`}
          href={`/admin/forms/${formId}/results`}
          text="Results"
        />
      </div>
      <Component />
    </div>
  );
}
