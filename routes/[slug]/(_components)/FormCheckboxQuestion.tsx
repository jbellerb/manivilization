import CheckboxGroup from "../../../islands/CheckboxGroup.tsx";

import type {
  CheckboxQuestion,
  CheckboxRolesQuestion,
} from "../../../utils/form/types.ts";

type Props = {
  question: CheckboxQuestion | CheckboxRolesQuestion;
  value?: string;
  issues?: unknown[];
};

export default function FormCheckboxQuestion(
  { question, value, issues }: Props,
) {
  const checked = value?.split(", ");

  return (
    <CheckboxGroup
      name={question.name}
      comment={question.comment}
      options={question.type === "checkbox_roles"
        ? question.options.map((option) => option.label)
        : question.options}
      checked={checked}
      required={question.required}
      error={issues?.includes("required")}
    />
  );
}
