import Radio from "../../../components/Radio.tsx";
import classnames from "../../../utils/classnames.ts";

import type { RadioQuestion } from "../../../utils/form/types.ts";

type Props = {
  question: RadioQuestion;
  value?: string;
  issues?: unknown[];
};

export default function FormRadioQuestion(
  { question, value, issues }: Props,
) {
  const error = issues?.some((issue) =>
    issue === "excess" || issue === "required"
  );
  return (
    <fieldset
      id={`question-${question.name}`}
      class="space-y-2 group"
      role="radiogroup"
    >
      <legend class="text-lg">
        {question.comment}
        <span
          class={classnames(
            "block mt-0 text-sm font-semibold transition-color group-has-invalid:!text-red-400",
            error ? "text-red-400" : "text-gray-400",
          )}
        >
          * Required
        </span>
      </legend>
      {question.options.map((option, idx) => (
        <Radio
          name={`question-${question.name}`}
          id={`radio-${question.name}-${idx}`}
          label={option}
          checked={value ? option === value : idx === 0}
          value={option}
          required={idx === 0}
        />
      ))}
    </fieldset>
  );
}
