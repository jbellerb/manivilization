import { useSignal } from "@preact/signals";

import Checkbox from "../../../../../components/Checkbox.tsx";
import ValidatedTextInput from "../../../../../islands/ValidatedTextInput.tsx";
import classnames from "../../../../../utils/classnames.ts";
import { validSnowflake } from "../../../../../utils/discord/snowflake.ts";

type Props = { class: string; submitterRole?: string };

export default function SubmitterRoleField(props: Props) {
  const submitterRole = useSignal(props.submitterRole);
  const assignsRole = useSignal(Boolean(props.submitterRole));

  return (
    <div class={classnames("flex", props.class)}>
      <Checkbox
        name="assign-role"
        id="checkbox-submit-active"
        class="max-w-36"
        label="Assign role for submitters?"
        checked={assignsRole.value}
        onChange={(e) => assignsRole.value = e.currentTarget.checked}
        presentational
      />
      <ValidatedTextInput
        name={assignsRole.value ? "submitter_role" : ""}
        id="input-submitter_role"
        label="Role ID *"
        class="ml-3"
        onChange={(e) => submitterRole.value = e.currentTarget.value}
        onInput={(e) =>
          e.currentTarget.setCustomValidity(
            validSnowflake(e.currentTarget.value)
              ? ""
              : "Please enter a valid Discord role ID.",
          )}
        disabled={!assignsRole.value}
        value={submitterRole.value}
        required
      />
    </div>
  );
}
