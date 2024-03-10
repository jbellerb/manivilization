import { useSignal } from "@preact/signals";

import Select from "../components/Select.tsx";
import TextInput from "../components/TextInput.tsx";
import classnames from "../utils/classnames.ts";
import { Form, Question } from "../utils/form.ts";

type IconButtonProps = {
  label: string;
  class: string;
  onClick: () => void;
};

function IconButton(props: IconButtonProps) {
  return (
    <button
      aria-label={props.label}
      type="button"
      class={classnames(
        "p-1 text-gray-600 hover:text-gray-500 focus-visible:text-gray-400 active:text-white transition-color",
        props.class,
      )}
      onClick={props.onClick}
    >
    </button>
  );
}

export type Props = {
  questions: Form["questions"];
};

export default function FormEditor(props: Props) {
  const test = [
    { type: "text", name: "test1", label: "Label?" },
    { type: "checkbox", name: "test2", options: ["a", "b", "c"] },
  ] satisfies Question[];
  const questions = useSignal(test ?? []);

  const addQuestion = (question: Question) =>
    questions.value = [...questions.value, question];
  const deleteQuestion = (idx: number) =>
    questions.value = questions.value.toSpliced(idx, 1);
  const swapQuestions = (a: number, b: number) => {
    const copy = [...questions.value];
    [copy[a], copy[b]] = [copy[b], copy[a]];
    questions.value = copy;
  };
  const changeType = (idx: number, type: string) =>
    questions.value = questions.value.map((question, i) =>
      (idx === i)
        ? (type === "text"
          ? { type: "text", name: question.name, label: "" }
          : { type: "checkbox", name: question.name, options: [""] })
        : question
    );

  return (
    <>
      <ul class="space-y-6">
        {questions.value.map((question: Question, idx: number) => (
          <li class="flex" key={question.name}>
            <div class="flex flex-col mr-2 space-y-2">
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
              <IconButton
                label="Delete question"
                class="after:i-mdi-close"
                onClick={() =>
                  deleteQuestion(idx)}
              />
            </div>
            <div class="flex grow flex-col space-y-2">
              <div class="flex items-center space-x-4">
                <Select
                  name={`question-${idx}-type`}
                  label="Type"
                  onChange={(e) => changeType(idx, e.currentTarget.value)}
                  value={question.type}
                >
                  <option value="text">Textbox</option>
                  <option value="checkbox">Checkboxes</option>
                </Select>
                <TextInput
                  name={`question-${idx}-name`}
                  label="Column Name"
                  value={question.name}
                />
              </div>
              {(question.type === "text")
                ? <TextInput name={`question-${idx}-label`} label="Question" />
                : undefined}
            </div>
          </li>
        ))}
      </ul>
      <div class="flex justify-end">
        <button
          type="button"
          class="p-2 border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color after:i-mdi-plus"
          onClick={() => (addQuestion({
            type: "text",
            name: `col_${questions.value.length + 1}`,
            label: "",
          }))}
        >
        </button>
      </div>
    </>
  );
}
