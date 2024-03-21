import { IS_BROWSER } from "$fresh/runtime.ts";
import { useSignal } from "@preact/signals";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
};

export default function GrowableTextArea(props: Props) {
  const value = useSignal(props.value ?? "");

  return (
    <div
      class="relative z-0 pt-7 growable after:px-3 after:py-2"
      data-value={value + " "}
    >
      <label
        for={`textarea-${props.name}`}
        class="absolute text-sm font-semibold text-gray-400 peer-focus-visible:text-gray-600 origin-[0] top-0 transition-color -z-10"
      >
        {props.label}
      </label>
      <textarea
        name={props.name}
        id={`textarea-${props.name}`}
        class={classnames(
          "block px-3 py-2 bg-transparent border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white rounded outline-none transition-border-color peer",
          IS_BROWSER ? "resize-none overflow-hidden" : "",
        )}
        placeholder=" "
        required={props.required}
        value={value}
        onInput={(e) => value.value = e.currentTarget.value}
      />
    </div>
  );
}
