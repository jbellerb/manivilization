import { Client } from "postgres/client.ts";

import type { User } from "./discord/user.ts";

export type Form = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  description?: string;
  questions?: { version: string; questions: Question[] };
  success_message?: string;
};

export type Response = {
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

export async function listForms(
  client: Client,
): Promise<{ id: Form["id"]; name: Form["name"] }[]> {
  const { rows } = await client.queryObject<{ id: string; name: string }>`
    SELECT id, name FROM forms;
  `;

  return rows;
}

export async function createForm(client: Client, form: Form) {
  await client.queryArray`
    INSERT INTO forms VALUES (
      ${form.id},
      ${form.name},
      ${form.slug},
      ${form.active},
      ${form.description},
      ${form.questions},
      ${form.success_message}
    );
  `;
}

export async function getForm(client: Client, id: string): Promise<Form> {
  const { rows } = await client.queryObject<Form>`
    SELECT * FROM forms WHERE id = ${id};
  `;
  const form = rows[0];

  if (!form) throw new BadFormError("unknown form");
  return form;
}

export async function getFormBySlug(
  client: Client,
  slug: string,
): Promise<Form> {
  const { rows } = await client.queryObject<Form>`
    SELECT * FROM forms WHERE slug = ${slug};
  `;
  const form = rows[0];

  if (!form) throw new BadFormError("unknown form");
  return form;
}

export async function updateForm(client: Client, form: Form) {
  await client.queryArray`
    UPDATE forms SET
      name = ${form.name},
      slug = ${form.slug},
      active = ${form.active},
      description = ${form.description ?? null},
      questions = ${form.questions ?? null},
      success_message = ${form.success_message ?? null}
      WHERE id = ${form.id};
  `;
}

export function parseEditorFormData(data: FormData): Omit<Form, "id"> {
  const parseValue = <T>(name: string, value: T | undefined | null): T => {
    if (!value) throw new FormParseError(`${name} missing from request`);
    return value;
  };
  const parseString = <T>(
    name: string,
    value: T | undefined | null,
  ): string => {
    const known = parseValue(name, value);
    if (typeof known !== "string") {
      throw new FormParseError(`${name} is not a string`);
    }
    return known;
  };
  const mapMaybe = <T, R>(
    fn: (name: string, value: T) => R,
    name: string,
    value: T | undefined | null,
  ): R | undefined => value ? fn(name, value) : undefined;

  const questionInfo: Record<
    string,
    Record<string, string | Record<string, string>>
  > = {};
  const re = /question-(\d*)-([^-]*)(?:-(\d*))?/;
  for (const pair of data.entries()) {
    const match = pair[0].match(re);
    if (match) {
      const name = `question-${match[1]}-${match[2]}`;
      const question = questionInfo[match[1]] ?? {};
      const key = question[match[2]];
      if (match[3]) {
        if (typeof key === "string") {
          throw new FormParseError(
            `${name} was provided as both a string and a list`,
          );
        }
        question[match[2]] = {
          ...key,
          [match[3]]: parseString(`${name}-${match[3]}`, pair[1]),
        };
      } else {
        if (key && typeof key !== "string") {
          throw new FormParseError(
            `${name} was provided as both a list and a string`,
          );
        }
        question[match[2]] = parseString(name, pair[1]);
      }
      questionInfo[match[1]] = question;
    }
  }

  const questions: Question[] = [];
  for (const key of Object.keys(questionInfo).sort()) {
    const type = parseString(
      `questions[${key}].type`,
      questionInfo[key]["type"],
    );
    const name = parseString(
      `questions[${key}].name`,
      questionInfo[key]["name"],
    );
    if (type === "text") {
      const label = parseString(
        `questions[${key}].label`,
        questionInfo[key]["label"],
      );
      questions.push({ type, name, label });
    } else if (type === "checkbox") {
      const options = parseValue(
        `questions[${key}].options`,
        questionInfo[key]["options"],
      );
      if (typeof options === "string") {
        throw new FormParseError(`questions[${key}].options is not a list`);
      } else {
        const optionsArray = Object.keys(options).sort().map((i) => options[i]);
        questions.push({ type, name, options: optionsArray });
      }
    } else {
      throw new FormParseError(
        `questions[${key}] is an unknown type "${type}"`,
      );
    }
  }

  return {
    name: parseString("name", data.get("name")),
    slug: parseString("slug", data.get("slug")),
    active: parseString("active", data.get("active") ?? "off") === "on",
    description: mapMaybe(parseString, "description", data.get("description")),
    questions: { version: "v1", questions },
    success_message: mapMaybe(
      parseString,
      "success_message",
      data.get("success_message"),
    ),
  };
}

export function parseFormData(data: FormData, form: Form): object {
  const answers: Record<string, string[]> = {};
  for (const pair of data.entries()) {
    if (pair[0].startsWith("question-") && typeof pair[1] === "string") {
      answers[pair[0].substring(9)] ??= [];
      answers[pair[0].substring(9)].push(pair[1]);
    }
  }

  const response: Record<string, string> = {};
  if (form.questions) {
    for (const question of form.questions.questions) {
      if (question.type === "text") {
        if (!answers[question.name]) {
          throw new FormParseError(`${question.name} missing from request`);
        }
        response[question.name] = answers[question.name][0];
      } else if (question.type === "checkbox") {
        response[question.name] = (answers[question.name] ?? []).join(", ");
      }
    }
  }

  return response;
}

export async function createResponse(
  client: Client,
  form: Form,
  user: User,
  response: object,
): Promise<string> {
  const id = crypto.randomUUID();
  await client.queryArray`
    INSERT INTO responses VALUES (
      ${id},
      ${form.id},
      ${user.id},
      ${response},
      ${new Date()}
    );
  `;
  return id;
}

export async function getResponse(
  client: Client,
  id: string,
): Promise<Response | undefined> {
  const { rows } = await client.queryObject<Response>`
    SELECT * FROM responses WHERE id = ${id};
  `;
  return rows[0];
}

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
