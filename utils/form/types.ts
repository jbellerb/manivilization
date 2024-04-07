export type TextQuestion = {
  type: "text";
  name: string;
  required: boolean;
  comment?: string;
  label?: string;
};

export type CheckboxQuestion = {
  type: "checkbox";
  name: string;
  required: boolean;
  comment?: string;
  options: string[];
};

export type Question = TextQuestion | CheckboxQuestion;

export type FormSpec = {
  version: string;
  questions: Question[];
};

export type ValidationIssue = "required";

export class BadFormError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BadFormError";
  }
}

export class FormParseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "FormParseError";
  }
}
