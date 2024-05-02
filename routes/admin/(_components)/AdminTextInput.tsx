import { JSX } from "preact";

import classnames from "../../../utils/classnames.ts";

type Props = {
  name: string;
  class?: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function AdminTextInput(
  { name, class: extraClasses, ...props }: Props,
) {
  return (
    <input
      type="text"
      name={name}
      id={`input-${name}`}
      class={classnames(
        "shadow-debossed px-[4px] py-[2px] border border-windows-gray",
        extraClasses,
      )}
      {...props}
    />
  );
}
