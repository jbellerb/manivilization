import { JSX } from "preact";

import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  label?: string;
  id?: string;
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  value?: string;
  checked?: boolean;
  required?: boolean;
  class?: string;
};

export default function Checkbox(props: Props) {
  return (
    <div
      class={classnames("flex items-center", props.class ?? "")}
    >
      <input
        type="checkbox"
        name={props.name}
        id={props.id ?? `checkbox-${props.name}`}
        class="w-6 h-6 bg-black border-2 checked:border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded transition-border-color"
        onChange={props.onChange}
        value={props.value}
        checked={props.checked}
        required={props.required ?? false}
      />
      {props.label && (
        <label
          for={props.id ?? `checkbox-${props.name}`}
          class="ml-2"
        >
          {props.label}
        </label>
      )}
    </div>
  );
}
