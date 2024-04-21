import { useRef } from "preact/hooks";
import { batch, useSignal, useSignalEffect } from "@preact/signals";

import Checkbox from "../components/Checkbox.tsx";
import classnames from "../utils/classnames.ts";

type Props = {
  name: string;
  comment?: string;
  options: string[];
  checked?: string[];
  required?: boolean;
  error?: boolean;
};

export default function CheckboxGroup(props: Props) {
  const setRef = useRef<HTMLFieldSetElement>(null);
  const untouched = useSignal<boolean>(true);
  const checked = useSignal<Record<string, boolean>>(
    Object.fromEntries(props.options
      .map((option) => [option, props.checked?.includes(option) ?? false])),
  );

  useSignalEffect(() => {
    if (setRef.current && props.required && props.options.length > 1) {
      const finalBox = setRef.current.lastElementChild?.firstElementChild;
      if (finalBox instanceof HTMLInputElement) {
        finalBox.setCustomValidity(
          Object.values(checked.value).some((x) => x)
            ? ""
            : "At least one box must be checked.",
        );
      }
    }
  });

  return (
    <fieldset
      id={`question-${props.name}`}
      class="space-y-2 group"
      ref={setRef}
    >
      {(props.comment != null || props.required) && (
        <legend class="text-lg">
          {props.comment}
          {props.required && (
            <span
              class={classnames(
                "block mt-0 text-sm font-semibold transition-color",
                { "group-has-invalid:!text-red-400": !untouched.value },
                props.error ? "text-red-400" : "text-gray-400",
              )}
            >
              * Required
            </span>
          )}
        </legend>
      )}
      {props.options.map((option, idx) => (
        <Checkbox
          name={`question-${props.name}`}
          id={`checkbox-${props.name}-${idx}`}
          label={option}
          checked={checked.value[option]}
          onChange={(e) =>
            batch(() => {
              untouched.value = false;
              checked.value = {
                ...checked.value,
                [option]: e.currentTarget.checked,
              };
            })}
          value={option}
          required={props.options.length === 1 ? props.required : undefined}
        />
      ))}
    </fieldset>
  );
}
