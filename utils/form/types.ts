export type Form = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  description?: string;
  questions?: { version: string; questions: Question[] };
  success_message?: string;
};

export type FormResponse = {
  id: string;
  form: string;
  discord_id: string;
  response?: Record<string, string>;
  date?: Date;
};

export type Question = {
  type: "text";
  name: string;
  label: string;
} | {
  type: "checkbox";
  name: string;
  options: string[];
};

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
