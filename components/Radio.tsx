import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  class?: string;
  label?: string;
  presentational?: boolean;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function Radio(
  { name, class: extraClasses, label, presentational, ...props }: Props,
) {
  return (
    <div
      role="presentation"
      class={classnames("flex items-center", extraClasses ?? "")}
    >
      <input
        type="radio"
        name={presentational ? undefined : name}
        id={`radio-${name}`}
        class="w-6 h-6 shrink-0 bg-black border-2 checked:border-2 border-gray-600 hover:border-gray-500 group-has-focus-visible:border-white active:border-white transition-border-color"
        {...props}
      />
      {label && (
        <label
          for={props.id ?? `radio-${name}`}
          class="ml-2"
        >
          {label}
        </label>
      )}
    </div>
  );
}
