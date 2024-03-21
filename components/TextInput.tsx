import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label?: string;
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  value?: string;
  placeholder?: string;
  required?: boolean;
  class?: string;
};

export default function TextInput(props: Props) {
  return (
    <div
      class={classnames(
        "grow relative text-lg",
        { "pt-4 z-0": Boolean(props.label) },
        props.class ?? "",
      )}
    >
      {props.label && (
        <label
          for={`input-${props.name}`}
          class="absolute text-sm text-gray-400 peer-focus-visible:text-gray-600 font-semibold origin-[0] top-0 transition-color -z-10"
        >
          {props.label}
        </label>
      )}
      <input
        type="text"
        name={props.name}
        id={`input-${props.name}`}
        class="block w-full py-1 bg-transparent border-b-2 border-gray-600 hover:border-gray-500 focus-visible:border-white transition-border-color peer"
        onChange={props.onChange}
        value={props.value}
        placeholder={props.placeholder}
        required={props.required ?? false}
      />
    </div>
  );
}
