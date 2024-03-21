import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label?: string;
  class?: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function TextInput(
  { name, label, class: extraClasses, ...props }: Props,
) {
  return (
    <div
      role="presentation"
      class={classnames(
        "grow relative text-lg group",
        { "pt-4 z-0": Boolean(label) },
        extraClasses ?? "",
      )}
    >
      {label && (
        <label
          for={props.id ?? `input-${name}`}
          class="absolute text-sm text-gray-400 group-has-[:focus-visible]:text-gray-600 font-semibold origin-[0] top-0 transition-color -z-10"
        >
          {label}
        </label>
      )}
      <input
        type="text"
        name={name}
        id={`input-${name}`}
        class="block w-full py-1 bg-transparent border-b-2 border-gray-600 hover:border-gray-500 focus-visible:border-white transition-border-color"
        {...props}
      />
    </div>
  );
}
