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

export default function ValidatedTextInput(props: Props) {
  const untouched = useSignal<boolean>(true);

  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        untouched.value = true;
        props.onFocus && props.onFocus(e);
      }}
      onBlur={(e) => {
        untouched.value = false;
        props.onBlur && props.onBlur(e);
      }}
      validating={!untouched.value}
    />
  );
}
