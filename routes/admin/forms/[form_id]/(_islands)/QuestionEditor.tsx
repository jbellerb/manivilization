import { useSignal } from "@preact/signals";

import OptionsEditor from "./OptionsEditor.tsx";
import OptionsRolesEditor from "./OptionsRolesEditor.tsx";
import IconButton from "../../../../../components/IconButton.tsx";
import InlineCheckbox from "../../../../../components/InlineCheckbox.tsx";
import Select from "../../../../../components/Select.tsx";
import TextInput from "../../../../../components/TextInput.tsx";
import ValidatedTextInput from "../../../../../islands/ValidatedTextInput.tsx";
import classnames from "../../../../../utils/classnames.ts";

import type {
  CheckboxRolesQuestion,
  Question,
} from "../../../../../utils/form/types.ts";

export type Props = {
  questions?: Question[];
};

type LooseQuestion = {
  type: Question["type"];
  stableId: string;
  name: string;
  required: boolean;
  comment?: string;
  props: Record<string, string[]>;
};

function loosen(
  { type, name, required, comment, ...props }: Question,
): LooseQuestion {
  const stableId = crypto.randomUUID();
  required = type === "radio" ? true : required;
  const stringifiedProps: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(props)) {
    if (type === "checkbox_roles" && key === "options") {
      const options = value as CheckboxRolesQuestion["options"];
      stringifiedProps.options = options.map((option) => option.label);
      stringifiedProps.roles = options.map((option) => option.role);
    } else {
      stringifiedProps[key] = Array.isArray(value) ? value : [value];
    }
  }

  return ({ type, stableId, name, required, comment, props: stringifiedProps });
}

function changeType(
  question: LooseQuestion,
  type: Question["type"],
): LooseQuestion {
  const required = type === "radio" ? true : question.required;
  const props = {
    ...question.props,
    ...(type === "text"
      ? { label: question.props.label ?? "" }
      : type === "checkbox" || type === "radio"
      ? { options: question.props.options ?? ["New Option"] }
      : type === "checkbox_roles"
      ? {
        options: question.props.options ?? ["New Option"],
        roles: question.props.roles ?? question.props.options?.map(() => "0") ??
          ["0"],
      }
      : undefined),
  };

  return { ...question, type, required, props };
}

export default function QuestionEditor(props: Props) {
  const questions = useSignal((props.questions ?? []).map(loosen));

  const addQuestion = (question: LooseQuestion) =>
    questions.value = [...questions.value, question];
  const deleteQuestion = (idx: number) =>
    questions.value = questions.value.toSpliced(idx, 1);
  const updateQuestion = (question: LooseQuestion, idx: number) =>
    questions.value = questions.value.toSpliced(idx, 1, question);
  const swapQuestions = (a: number, b: number) => {
    const copy = [...questions.value];
    [copy[a], copy[b]] = [copy[b], copy[a]];
    questions.value = copy;
  };

  return (
    <div>
      <ul class="space-y-6" aria-label="Questions">
        {questions.value.map((question, idx) => (
          <li class="flex" key={question.stableId} aria-label={question.name}>
            <div class="flex flex-col mr-2 space-y-2">
              <IconButton
                label="Delete question"
                class="after:i-mdi-close"
                onClick={() =>
                  deleteQuestion(idx)}
              />
              <IconButton
                label="Move question up"
                class="after:i-mdi-arrow-up"
                onClick={() =>
                  swapQuestions(idx, idx - 1 >= 0 ? idx - 1 : idx)}
              />
              <IconButton
                label="Move question down"
                class="after:i-mdi-arrow-down"
                onClick={() =>
                  swapQuestions(
                    idx,
                    idx + 1 < questions.value.length ? idx + 1 : idx,
                  )}
              />
            </div>
            <div class="flex grow flex-col space-y-2">
              <div class="flex items-center space-x-4">
                <Select
                  name={`question-${idx}-type`}
                  label="Type *"
                  onChange={(e) =>
                    updateQuestion(
                      changeType(
                        question,
                        e.currentTarget.value as Question["type"],
                      ),
                      idx,
                    )}
                  value={question.type}
                  required
                >
                  <option value="text">Textbox</option>
                  <option value="checkbox">Checkboxes</option>
                  <option value="checkbox_roles">Role Checkboxes</option>
                  <option value="radio">Radio Buttons</option>
                </Select>
                <ValidatedTextInput
                  name={`question-${idx}-name`}
                  label="Column Name *"
                  value={question.name}
                  onChange={(e) =>
                    updateQuestion(
                      { ...question, name: e.currentTarget.value },
                      idx,
                    )}
                  required
                />
                <InlineCheckbox
                  name={`question-${idx}-required`}
                  label="Required"
                  checked={question.required}
                  disabled={question.type === "radio"}
                  onChange={(e) =>
                    updateQuestion(
                      { ...question, required: e.currentTarget.checked },
                      idx,
                    )}
                />
              </div>
              <TextInput
                name={`question-${idx}-comment`}
                label="Question"
                value={question.comment}
                onChange={(e) =>
                  updateQuestion({
                    ...question,
                    comment: e.currentTarget.value,
                  }, idx)}
              />
              {question.type === "text"
                ? (
                  <TextInput
                    name={`question-${idx}-label`}
                    label="Label"
                    value={question.props.label[0]}
                    onChange={(e) =>
                      updateQuestion({
                        ...question,
                        props: {
                          ...question.props,
                          label: [e.currentTarget.value],
                        },
                      }, idx)}
                  />
                )
                : question.type === "checkbox" || question.type === "radio"
                ? (
                  <OptionsEditor
                    name={`question-${idx}`}
                    options={question.props.options}
                    onChange={(options) =>
                      updateQuestion({
                        ...question,
                        props: { ...question.props, options },
                      }, idx)}
                  />
                )
                : question.type === "checkbox_roles"
                ? (
                  <OptionsRolesEditor
                    name={`question-${idx}`}
                    options={question.props.options}
                    roles={question.props.roles}
                    onChange={(options, roles) =>
                      updateQuestion({
                        ...question,
                        props: { ...question.props, options, roles },
                      }, idx)}
                  />
                )
                : undefined}
            </div>
          </li>
        ))}
      </ul>
      <div
        class={classnames("flex justify-end", {
          "mt-4": questions.value.length > 0,
        })}
      >
        <button
          type="button"
          class="p-2 border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color after:block after:content-empty after:w-6 after:h-6 after:i-mdi-plus"
          aria-label="Add a question"
          onClick={() =>
            addQuestion(changeType({
              type: "text",
              stableId: crypto.randomUUID(),
              name: `col_${questions.value.length + 1}`,
              required: false,
              props: {},
            }, "text"))}
        >
        </button>
      </div>
    </div>
  );
}
