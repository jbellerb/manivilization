import ValidatedTextInput from "../../../islands/ValidatedTextInput.tsx";
import classnames from "../../../utils/classnames.ts";

import type { TextQuestion } from "../../../utils/form/types.ts";

type Props = {
  question: TextQuestion;
  value?: string;
  issues?: unknown[];
};

export default function FormTextQuestion(
  { question, value, issues }: Props,
) {
  return (
    <div
      id={`question-${question.name}`}
      aria-role="group"
      aria-labelledby={question.comment
        ? `question-${question.name}-comment`
        : undefined}
      class="space-y-2"
    >
      {question.comment != null && (
        <label
          class="block text-lg"
          id={`question-${question.name}-comment`}
        >
          {question.comment}
          {question.required && (
            <span
              class={classnames(
                "block text-sm font-semibold",
                issues?.includes("required") ? "text-red-400" : "text-gray-400",
              )}
            >
              * Required
            </span>
          )}
        </label>
      )}
      <ValidatedTextInput
        name={`question-${question.name}`}
        label={question.label}
        value={value}
        aria-describedby={question.comment && question.label
          ? `question-${question.name}-comment`
          : undefined}
        aria-labelledby={question.comment && !question.label
          ? `question-${question.name}-comment`
          : undefined}
        error={issues?.includes("required")}
        required={question.required}
      />
    </div>
  );
}
