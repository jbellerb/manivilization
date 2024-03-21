import { IS_BROWSER } from "$fresh/runtime.ts";
import { JSX } from "preact";
import { useSignal } from "@preact/signals";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label: string;
  value?: string;
} & JSX.HTMLAttributes<HTMLTextAreaElement>;

export default function GrowableTextArea(
  { name, label, value: originalValue, ...props }: Props,
) {
  const value = useSignal(originalValue ?? "");

  return (
    <div
      class="relative z-0 pt-7 growable after:px-3 after:py-2 group"
      data-value={value + " "}
    >
      <label
        for={props.id ?? `textarea-${name}`}
        class="absolute text-sm font-semibold text-gray-400 group-has-[:focus-visible]:text-gray-600 origin-[0] top-0 transition-color -z-10"
        title={props.required ? "Required" : undefined}
      >
        {label}
        {props.required && <span class="ml-1">*</span>}
      </label>
      <textarea
        name={name}
        id={`textarea-${name}`}
        class={classnames(
          "block px-3 py-2 bg-transparent border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white rounded outline-none transition-border-color",
          { "resize-none overflow-hidden": IS_BROWSER },
        )}
        placeholder=" "
        value={value}
        {...props}
        onInput={(e) => {
          props.onInput && props.onInput(e);
          value.value = e.currentTarget.value;
        }}
      />
    </div>
  );
}
