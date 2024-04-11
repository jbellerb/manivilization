import { JSX } from "preact";

import classnames from "../../../utils/classnames.ts";

type Props = {
  name: string;
  class?: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function AdminFileInput(
  { name, class: extraClasses, ...props }: Props,
) {
  return (
    <div role="presentation" class="group">
      <input
        type="file"
        name={name}
        id={`input-${name}`}
        class={classnames(
          "shadow-debossed px-[4px] py-[2px] border border-windows-gray peer",
          extraClasses,
        )}
        {...props}
      />
      <label
        for={props.id ?? `input-${name}`}
        class="ml-[1px] inline-block px-4 py-1 text-sm bg-windows-gray shadow-embossed peer-active:shadow-debossed peer-focus-visible:outline-1 peer-focus-visible:outline-dotted peer-focus-visible:outline-offset-[-5px] peer-focus-visible:outline-black"
        aria-hidden
      >
        <span class="relative group-has-active:top-[1px] group-has-active:left-[1px]">
          Browse...
        </span>
      </label>
    </div>
  );
}
