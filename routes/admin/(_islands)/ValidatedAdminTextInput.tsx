import { JSX } from "preact";
import { useSignal } from "@preact/signals";

import AdminTextInput from "../(_components)/AdminTextInput.tsx";
import { validSnowflake } from "../../../utils/discord/snowflake.ts";

type Props = {
  name: string;
  class?: string;
  disabled?: boolean;
  checkSnowflake?: string;
} & JSX.HTMLAttributes<HTMLInputElement>;

export default function ValidatedAdminTextInput(
  { value: initialValue, onChange, ...props }: Props,
) {
  const value = useSignal(initialValue);

  return (
    <AdminTextInput
      {...props}
      value={value.value}
      onInput={(e) => {
        if (props.checkSnowflake) {
          e.currentTarget.setCustomValidity(
            validSnowflake(e.currentTarget.value) ? "" : props.checkSnowflake,
          );
        }
      }}
      onChange={(e) => {
        value.value = e.currentTarget.value;
        onChange && onChange(e);
      }}
    />
  );
}
