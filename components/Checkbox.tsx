import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label?: string;
  class?: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function Checkbox(
  { name, label, class: extraClasses, ...props }: Props,
) {
  return (
    <div
      role="presentation"
      class={classnames("flex items-center", extraClasses ?? "")}
    >
      <input
        type="checkbox"
        name={name}
        id={`checkbox-${name}`}
        class="w-6 h-6 bg-black border-2 checked:border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded transition-border-color"
        {...props}
      />
      {label && (
        <label
          for={props.id ?? `checkbox-${name}`}
          class="ml-2"
        >
          {label}
        </label>
      )}
    </div>
  );
}
