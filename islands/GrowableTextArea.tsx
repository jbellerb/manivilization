import { IS_BROWSER } from "$fresh/runtime.ts";

import { useSignal } from "@preact/signals";
import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
};

export default function TextArea(props: Props) {
  const value = useSignal(props.value ?? "");

  return (
    <div
      class="relative z-0 mt-8 growable after:px-3 after:py-2"
      data-value={value + " "}
    >
      <textarea
        name={props.name}
        class={classnames(
          "block px-3 py-2 bg-transparent border-0 ring-2 focus-visible:ring-2 ring-gray-600 hover:ring-gray-500 focus-visible:ring-white rounded outline-none focus-visible:outline-none transition-shadow peer",
          IS_BROWSER ? "resize-none overflow-hidden" : "",
        )}
        placeholder=" "
        required={props.required}
        value={value}
        onInput={(e) => value.value = e.currentTarget.value}
      />
      <label
        for={props.name}
        class="absolute text-gray-400 peer-focus-visible:text-gray-600 font-semibold peer-placeholder-shown:font-normal origin-[0] top-2 -translate-y-10 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:translate-x-3 scale-[88%] peer-placeholder-shown:scale-100 transition -z-10"
      >
        {props.label}
      </label>
    </div>
  );
}
