import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label?: string;
  class?: string;
  error?: boolean;
  validating?: boolean;
  disabled?: boolean;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function TextInput(
  { name, label, class: extraClasses, error, validating, disabled, ...props }:
    Props,
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
          class={classnames(
            "absolute text-sm font-semibold origin-[0] top-0 transition-color -z-10",
            disabled
              ? "text-gray-600"
              : "text-gray-400 group-has-[:focus-visible]:text-gray-600",
          )}
        >
          {label}
        </label>
      )}
      <input
        type="text"
        name={name}
        id={`input-${name}`}
        class={classnames(
          "block w-full py-1 bg-transparent border-b-2 border-gray-600 transition-colors",
          disabled
            ? "text-gray-600 border-gray-700"
            : error
            ? "border-red-400"
            : classnames(
              "border-gray-600 hover:border-gray-500 focus-visible:border-white",
              { "invalid:!border-red-400": validating !== false },
            ),
        )}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}
