import { useSignal } from "@preact/signals";

import classnames from "../../../../../utils/classnames.ts";

import Checkbox from "../../../../../components/Checkbox.tsx";
import TextInput from "../../../../../components/TextInput.tsx";

type Props = { class: string; submitterRole?: string };

export default function SubmitterRoleField(props: Props) {
  const assignsRole = useSignal(Boolean(props.submitterRole));

  return (
    <div class={classnames("flex", props.class)}>
      <Checkbox
        name="active"
        id="checkbox-submit-active"
        class="max-w-36"
        label="Assign role for submitters?"
        checked={assignsRole.value}
        onChange={(e) => assignsRole.value = e.currentTarget.checked}
      />
      <TextInput
        name={assignsRole.value ? "submitter_role" : ""}
        id="input-submitter_role"
        label="Role ID"
        class="ml-3"
        disabled={!assignsRole.value}
        value={props.submitterRole}
      />
    </div>
  );
}
