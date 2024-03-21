import { useSignal } from "@preact/signals";

import Select from "../components/Select.tsx";
import TextInput from "../components/TextInput.tsx";
import classnames from "../utils/classnames.ts";

import type { Form, Question } from "../utils/form/types.ts";

type IconButtonProps = {
  label: string;
  class: string;
  onClick?: () => void;
};

function IconButton(props: IconButtonProps) {
  return (
    <button
      aria-label={props.label}
      type="button"
      class={classnames(
        "p-1 text-gray-600 hover:text-gray-500 focus-visible:text-gray-400 active:text-white transition-color after:block after:content-empty after:w-6 after:h-6",
        props.class,
      )}
      onClick={props.onClick}
    >
    </button>
  );
}

type OptionsEditorProps = {
  name: string;
  options: string[];
  onChange?: (options: string[]) => void;
};

function OptionsEditor(props: OptionsEditorProps) {
  const addOption = (option: string) =>
    props.onChange && props.onChange([...props.options, option]);
  const deleteOption = (idx: number) =>
    props.options.length > 1 && props.onChange &&
    props.onChange(props.options.toSpliced(idx, 1));
  const updateOption = (option: string, idx: number) =>
    props.onChange && props.onChange(props.options.toSpliced(idx, 1, option));

  return (
    <div class="flex">
      <IconButton
        label="Add an option"
        class="mt-auto after:i-mdi-plus"
        onClick={() => addOption("New Option")}
      />
      <div class="flex flex-col w-full ml-2">
        <label class="text-sm font-semibold text-gray-400">Options</label>
        <ul class="-mt-1">
          {props.options.map((option, idx) => (
            <li class="flex">
              <TextInput
                name={`${props.name}-options-${idx}`}
                value={option}
                onChange={(e) => updateOption(e.currentTarget.value, idx)}
                required
              />
              <IconButton
                label="Delete option"
                class="after:i-mdi-close"
                onClick={() => deleteOption(idx)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export type Props = {
  questions: Form["questions"];
};

export default function QuestionEditor(props: Props) {
  if (props.questions && props.questions.version !== "v1") {
    throw new Error("unsupported question format version");
  }
  const questions = useSignal(props.questions?.questions ?? []);

  const addQuestion = (question: Question) =>
    questions.value = [...questions.value, question];
  const deleteQuestion = (idx: number) =>
    questions.value = questions.value.toSpliced(idx, 1);
  const updateQuestion = (question: Question, idx: number) =>
    questions.value = questions.value.toSpliced(idx, 1, question);
  const swapQuestions = (a: number, b: number) => {
    const copy = [...questions.value];
    [copy[a], copy[b]] = [copy[b], copy[a]];
    questions.value = copy;
  };

  // This cast retains associated data with the previous type in case the user
  // changes it back. This is safe as only visible form elements are submitted.
  const changeType = (question: Question, type: Question["type"]) => ({
    ...question,
    type,
    ...(type === "text"
      ? { label: "label" in question ? question.label : "" }
      : type === "checkbox"
      ? { options: "options" in question ? question.options : ["New Option"] }
      : undefined),
  } as Question);

  return (
    <div>
      <ul class="space-y-6" aria-label="Questions">
        {questions.value.map((question: Question, idx: number) => (
          <li class="flex" key={question.name} aria-label={question.name}>
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
                  label="Type"
                  onChange={(e) =>
                    updateQuestion(
                      changeType(
                        question,
                        e.currentTarget.value as Question["type"],
                      ),
                      idx,
                    )}
                  value={question.type}
                >
                  <option value="text">Textbox</option>
                  <option value="checkbox">Checkboxes</option>
                </Select>
                <TextInput
                  name={`question-${idx}-name`}
                  label="Column Name"
                  value={question.name}
                  onChange={(e) =>
                    updateQuestion(
                      { ...question, name: e.currentTarget.value },
                      idx,
                    )}
                  required
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
              {(question.type === "text")
                ? (
                  <TextInput
                    name={`question-${idx}-label`}
                    label="Label"
                    value={question.label}
                    onChange={(e) =>
                      updateQuestion({
                        ...question,
                        label: e.currentTarget.value,
                      }, idx)}
                    required
                  />
                )
                : (question.type === "checkbox")
                ? (
                  <OptionsEditor
                    name={`question-${idx}`}
                    options={question.options}
                    onChange={(options) =>
                      updateQuestion({ ...question, options }, idx)}
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
          onClick={() => (addQuestion({
            type: "text",
            name: `col_${questions.value.length + 1}`,
            comment: "",
            label: "",
          }))}
        >
        </button>
      </div>
    </div>
  );
}
