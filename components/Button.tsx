import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  class?: string;
} & JSX.HTMLAttributes<HTMLButtonElement>;

export default function Button({ name, class: extraClasses, ...props }: Props) {
  return (
    <button
      type={props.onClick ? "button" : "submit"}
      class={classnames(
        "px-4 py-1 font-semibold tracking-wide border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color",
        extraClasses ?? "",
      )}
    >
      {name}
    </button>
  );
}
