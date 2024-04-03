import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  label: string;
  class: string;
} & JSX.HTMLAttributes<HTMLButtonElement>;

export default function IconButton(
  { label, class: extraClasses, ...props }: Props,
) {
  return (
    <button
      title={label}
      type="button"
      class={classnames(
        "p-1 text-gray-600 hover:text-gray-500 focus-visible:text-gray-400 active:text-white transition-color after:block after:content-empty after:w-6 after:h-6",
        extraClasses,
      )}
      {...props}
    >
    </button>
  );
}
