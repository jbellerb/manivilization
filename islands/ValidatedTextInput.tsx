import { JSX } from "preact";
import { useSignal } from "@preact/signals";

import TextInput from "../components/TextInput.tsx";

type Props = {
  name: string;
  label?: string;
  class?: string;
  error?: boolean;
  disabled?: boolean;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function ValidatedTextInput(
  { value: initialValue, onChange, onFocus, onBlur, ...props }: Props,
) {
  const untouched = useSignal<boolean>(true);
  const value = useSignal(initialValue);

  return (
    <TextInput
      {...props}
      value={value.value}
      onChange={(e) => {
        value.value = e.currentTarget.value;
        onChange && onChange(e);
      }}
      onFocus={(e) => {
        untouched.value = true;
        onFocus && onFocus(e);
      }}
      onBlur={(e) => {
        untouched.value = false;
        onBlur && onBlur(e);
      }}
      validating={!untouched.value}
    />
  );
}
