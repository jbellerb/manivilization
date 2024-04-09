import { JSX } from "preact";

import classnames from "../../../utils/classnames.ts";

type Props = {
  name: string;
  class?: string;
} & JSX.HTMLAttributes<HTMLButtonElement>;

export default function AdminButton(
  { name, class: extraClasses, ...props }: Props,
) {
  return (
    <button
      type={props.onClick ? "button" : "submit"}
      class={classnames(
        "group text-browser-blue active:text-browser-purple",
        extraClasses ?? "",
      )}
      {...props}
    >
      <span class="border-b border-transparent group-hover:border-current">
        {name}
      </span>
    </button>
  );
}
