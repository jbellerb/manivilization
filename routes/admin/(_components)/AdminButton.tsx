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
        "px-4 py-1 text-sm bg-windows-gray shadow-embossed active:shadow-debossed focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-offset-[-5px] focus-visible:outline-black group",
        extraClasses,
      )}
      {...props}
    >
      <span class="relative group-active:top-[1px] group-active:left-[1px]">
        {name}
      </span>
    </button>
  );
}
