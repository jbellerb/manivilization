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

export type CheckboxRolesQuestion = {
  type: "checkbox_roles";
  name: string;
  required: boolean;
  comment?: string;
  options: { label: string; role: string }[];
};

export type Question = TextQuestion | CheckboxQuestion | CheckboxRolesQuestion;

export type ValidationIssue = "required";
