import { fromSnowflake, toSnowflake } from "../discord/snowflake.ts";

import type { Question, ValidationIssue } from "./types.ts";
import type { EntityProps } from "../db/entity.ts";
import type { Form } from "../db/mod.ts";

type NestedFormData = { [property: string]: string[] | NestedFormData };

function updateRecord(
  base: NestedFormData,
  path: string,
  value: string,
): NestedFormData | string {
  const index = path.indexOf("-");
  if (index !== -1) {
    const segment = path.slice(0, index);
    const prev = base[segment];
    // A key that previously had values can't be indexed for. Return the
    // current segment so we can reconstruct where the error happened
    if (Array.isArray(prev)) return segment;
    const subRecord = typeof prev === "string" ? {} : prev ?? {};

    const rec = updateRecord(subRecord, path.slice(index + 1), value);
    // Prepend our parent segment to the error and continue working up
    if (typeof rec === "string") return `${segment}.${rec}`;
    return { ...base, [segment]: rec };
  } else {
    const prev = base[path];
    // An attribute that previously had child attributes can't have a value.
    // Again, return the segment for error handling
    if (prev != null && !Array.isArray(prev)) return path;
    return { ...base, [path]: [...(prev ?? []), value] };
  }
}

function walkFormData(data: FormData): NestedFormData {
  let result = {};
  for (const [key, value] of data.entries()) {
    if (typeof value !== "string") {
      throw new FormParseError(`${key} is not a string`);
    }
    result = updateRecord(result, key, value);
    // A string was returned indicating an attempt to assign the returned
    // attribute both values and child attributes
    if (typeof result === "string") {
      throw new FormParseError(
        `${result} can't have both values and attributes`,
      );
    }
  }

  return result;
}

function isDefined<T>(name: string, value: T): NonNullable<T> {
  if (value != null) return value;
  throw new FormParseError(`${name} is missing from request`);
}

function isString<T>(name: string, value: T): string {
  const definedValue = isDefined(name, value);
  if (typeof definedValue === "string") return definedValue;
  throw new FormParseError(`${name} is not a string`);
}

function isValues(name: string, value: NestedFormData | string[]): string[] {
  const definedValue = isDefined(name, value);
  if (Array.isArray(definedValue)) return definedValue;
  throw new FormParseError(`${name} is not a string`);
}

function isAttrs(
  name: string,
  value: NestedFormData | string[],
): NestedFormData {
  const definedValue = isDefined(name, value);
  if (!Array.isArray(definedValue)) return definedValue;
  throw new FormParseError(`${name} is not a list`);
}

function mapMaybe<T, R>(
  fn: (name: string, value: T) => R,
  name: string,
  value: T | undefined | null,
): R | undefined {
  return value == null ? undefined : fn(name, value);
}

export function parseEditorFormData(
  data: FormData,
): Omit<EntityProps<Form>, "id" | "instance"> {
  const questions: Question[] = [];
  const formData = walkFormData(data);
  for (let [key, value] of Object.entries(formData.question ?? {}).sort()) {
    value = isAttrs(`question.${key}`, value);
    const type = isValues(`question.${key}.type`, value.type)[0];
    const name = isValues(`question.${key}.name`, value.name)[0];
    const required =
      (mapMaybe(isValues, `question.${key}.required`, value.required) ??
        ["off"])[0] === "on";
    const comment = isValues(`question.${key}.comment`, value.comment)[0];

    if (type === "text") {
      const label = mapMaybe(isValues, `question.${key}.label`, value.label)
        ?.[0];
      questions.push({ type, name, required, comment, label });
    } else if (type === "checkbox" || type === "radio") {
      const options = isAttrs(`question.${key}.options`, value.options);
      const optionsList = Object.keys(options).sort().map((i) =>
        isValues(`question.${key}.options[${i}]`, options[i])[0]
      );
      if (type === "checkbox") {
        questions.push({ type, name, required, comment, options: optionsList });
      } else {
        const required = true;
        questions.push({ type, name, required, comment, options: optionsList });
      }
    } else if (type === "checkbox_roles") {
      const labels = isAttrs(`question.${key}.labels`, value.labels);
      const roles = isAttrs(`question.${key}.roles`, value.roles);
      const optionsList = Object.keys(labels).sort().map((i) => ({
        label: isValues(`question.${key}.options[${i}]`, labels[i])[0],
        role: fromSnowflake(
          toSnowflake(isValues(`question.${key}.roles[${i}]`, roles[i])[0]),
        ),
      }));
      questions.push({ type, name, required, comment, options: optionsList });
    } else {
      throw new FormParseError(
        `question.${key}.type is unexpected type "${type}"`,
      );
    }
  }

  return {
    name: isString("name", data.get("name")),
    slug: isString("slug", data.get("slug")),
    active: isString("active", data.get("active") ?? "off") === "on",
    description: mapMaybe(isString, "description", data.get("description")),
    questions: { _: questions },
    successMessage: mapMaybe(
      isString,
      "success_message",
      data.get("success_message"),
    ),
    submitterRole: mapMaybe(
      (n, v) => toSnowflake(isString(n, v)),
      "submitter_role",
      data.get("submitter_role"),
    ) ?? null,
  };
}

export function parseFormData(
  data: FormData,
  form: Form,
): {
  answers: Record<string, string>;
  issues: Record<string, ValidationIssue[]>;
} {
  const answers: Record<string, string> = {};
  const issues: Record<string, ValidationIssue[]> = {};

  if (form.questions) {
    const values = isAttrs("question", walkFormData(data).question);
    for (const question of form.questions._) {
      const name = `question.${question.name}`;
      if (question.type === "text") {
        answers[question.name] =
          mapMaybe(isValues, name, values[question.name])?.[0] ?? "";
      } else if (
        question.type === "checkbox" || question.type === "checkbox_roles"
      ) {
        answers[question.name] =
          mapMaybe(isValues, name, values[question.name])?.join(", ") ?? "";
      } else if (question.type === "radio") {
        const answer = mapMaybe(isValues, name, values[question.name]);
        if (answer && answer.length > 0) {
          answers[question.name] = answer[0];
          if (answer.length > 1) {
            issues[question.name] ??= [];
            issues[question.name].push("excess");
          }
        }
      }

      if (!answers[question.name] && question.required) {
        issues[question.name] ??= [];
        issues[question.name].push("required");
      }
    }
  }

  return { answers, issues };
}

export class FormParseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "FormParseError";
  }
}
