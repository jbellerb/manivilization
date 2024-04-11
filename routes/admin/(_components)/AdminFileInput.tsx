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
    <div role="presentation">
      <input
        type="file"
        name={name}
        id={`input-${name}`}
        class={classnames(
          "shadow-debossed px-[4px] py-[2px] border border-input-border peer",
          extraClasses,
        )}
        {...props}
      />
      <label
        for={props.id ?? `input-${name}`}
        class="ml-[1px] inline-block px-4 py-1 text-sm bg-input-border shadow-embossed peer-focus-visible:outline-1 peer-focus-visible:outline-dotted peer-focus-visible:outline-offset-[-5px] peer-focus-visible:outline-black"
        aria-hidden
      >
        Browse...
      </label>
    </div>
  );
}
