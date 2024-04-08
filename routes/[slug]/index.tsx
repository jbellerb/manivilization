import { decodeBase64Url, encodeBase64Url } from "$std/encoding/base64url.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { decode, encode } from "cbor-x";

import type { Handlers, PageProps } from "$fresh/server.ts";

import UserBanner from "./(_components)/UserBanner.tsx";
import Button from "../../components/Button.tsx";
import Checkbox from "../../components/Checkbox.tsx";
import TextInput from "../../components/TextInput.tsx";
import classnames from "../../utils/classnames.ts";
import db from "../../utils/db/mod.ts";
import { FormResponse } from "../../utils/db/schema.ts";
import { assignRole } from "../../utils/discord/guild.ts";
import { DiscordHTTPError } from "../../utils/discord/http.ts";
import { FormParseError, parseFormData } from "../../utils/form/parse.ts";

import type { FormState as State } from "./_middleware.ts";
import type {
  CheckboxQuestion,
  Question,
  TextQuestion,
} from "../../utils/form/types.ts";

type Data = {
  completed: boolean;
  answers?: Record<string, unknown>;
  issues?: Record<string, unknown>;
};

function maybeObject(
  input: unknown,
): Record<string, unknown> | undefined {
  if (typeof input === "object" && input !== null) {
    // Cast is safe because Record is a subset of object. I don't know why
    // TypeScript can't infer this without a type guard which seems
    // unneccesary...
    return input as Record<string, unknown>;
  }
  return undefined;
}
function maybeArray(input: unknown): unknown[] | undefined {
  if (typeof input === "object" && input !== null && Array.isArray(input)) {
    return input;
  }
  return undefined;
}
function maybeString(input: unknown): string | undefined {
  if (typeof input === "string") return input;
  return undefined;
}

export const handler: Handlers<Data, State> = {
  async GET(req, ctx) {
    const { searchParams } = new URL(req.url);
    const error = searchParams.get("error");

    let completed = false;
    let answers: Data["answers"] = {};
    let issues: Data["issues"] = {};
    if (ctx.state.user) {
      const user = ctx.state.user;
      const response = await db.responses.findOne({ response: true }, {
        where: (response, { and, eq }) =>
          and(
            eq(response.form, ctx.state.form.id),
            eq(response.discordId, user.id),
          ),
        orderBy: (response, { desc }) => desc(response.date),
      });
      if (response?.response && Object.keys(response.response).length > 0) {
        completed = true;
        answers = response.response;
      }
    }

    if (error) {
      const errorRaw = decode(decodeBase64Url(error));
      answers = maybeObject(errorRaw.answers);
      issues = maybeObject(errorRaw.issues);
    }

    return ctx.render({ completed, answers, issues });
  },
  async POST(req, ctx) {
    if (!ctx.state.user) {
      return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
    }

    const formData = await req.formData();
    try {
      const answers = parseFormData(formData, ctx.state.form);
      if (Object.keys(answers.issues).length > 0) {
        const errorData = encodeBase64Url(encode(answers));
        const firstError = ctx.state.form.questions?.questions
          ?.find((question) => question.name in answers.issues)?.name;
        const headers = new Headers({
          Location:
            `/${ctx.state.form.slug}?error=${errorData}#question-${firstError}`,
        });
        return new Response(null, { status: STATUS_CODE.SeeOther, headers });
      }

      const response = new FormResponse(
        ctx.state.form.id,
        ctx.state.user.id,
        ctx.state.user.username,
        answers.answers,
      );
      await db.responses.insert(response);

      if (ctx.state.form.submitterRole) {
        try {
          await assignRole(ctx.state.user.id, ctx.state.form.submitterRole);
        } catch (e) {
          if (e instanceof DiscordHTTPError) console.log(e);
          else throw e;
        }
      }

      const headers = new Headers({
        Location: `/${ctx.state.form.slug}/success?response=${response.id}`,
      });
      return new Response(null, { status: STATUS_CODE.SeeOther, headers });
    } catch (e) {
      if (e instanceof FormParseError) {
        console.log(e);
        return new Response("Bad Request", { status: STATUS_CODE.BadRequest });
      }
      throw e;
    }
  },
};

function ResubmitWarning() {
  return (
    <aside class="flex items-center">
      <div class="mr-4 text-3xl" aria-label="Alert">
        !
      </div>
      <p class="markdown markdown-invert markdown-gray font-bold italic tracking-wide">
        You've already filled out this form. If you would like to change your
        response, please edit it and resubmit.
      </p>
    </aside>
  );
}

function FormTextQuestion(
  props: { question: TextQuestion; value?: string; issues?: unknown[] },
) {
  return (
    <div
      id={`question-${props.question.name}`}
      aria-role="group"
      aria-labelledby={props.question.comment &&
        `question-${props.question.name}-comment`}
      class="space-y-2"
    >
      {props.question.comment && (
        <label
          class="block text-lg"
          id={`question-${props.question.name}-comment`}
        >
          {props.question.comment}
          {props.question.required && (
            <span
              class={classnames(
                "block text-sm font-semibold",
                props.issues?.includes("required")
                  ? "text-red-400"
                  : "text-gray-400",
              )}
            >
              * Required
            </span>
          )}
        </label>
      )}
      <TextInput
        name={`question-${props.question.name}`}
        label={props.question.label}
        value={props.value}
        aria-describedby={!props.question.label
          ? undefined
          : props.question.comment &&
            `question-${props.question.name}-comment`}
        aria-labelledby={props.question.label
          ? undefined
          : props.question.comment &&
            `question-${props.question.name}-comment`}
        error={props.issues?.includes("required")}
        required={props.question.required}
      />
    </div>
  );
}

function FormCheckboxQuestion(
  props: { question: CheckboxQuestion; value?: string; issues?: unknown[] },
) {
  const checked = props.value?.split(", ");

  return (
    <fieldset id={`question-${props.question.name}`} class="space-y-2">
      {props.question.comment && (
        <legend class="text-lg">
          {props.question.comment}
          {props.question.required && (
            <span
              class={classnames(
                "block mt-0 text-sm font-semibold",
                props.issues?.includes("required")
                  ? "text-red-400"
                  : "text-gray-400",
              )}
            >
              * Required
            </span>
          )}
        </legend>
      )}
      {props.question.options.map((option, idx) => (
        <Checkbox
          name={`question-${props.question.name}`}
          id={`checkbox-${props.question.name}-${idx}`}
          label={option}
          checked={checked?.includes(option)}
          value={option}
          required={props.question.options.length === 1
            ? props.question.required
            : undefined}
        />
      ))}
    </fieldset>
  );
}

export default function FormPage({ data, state }: PageProps<Data, State>) {
  return (
    <>
      <UserBanner path={`/${state.form.slug}`} user={state.user} />
      {state.user && (
        <form
          method="post"
          class="mt-10 mx-auto max-w-lg w-full space-y-8"
        >
          {data.completed && <ResubmitWarning />}
          {state.form.questions &&
            state.form.questions.questions.map((question: Question) =>
              question.type === "text"
                ? (
                  <FormTextQuestion
                    question={question}
                    value={maybeString(data.answers?.[question.name])}
                    issues={maybeArray(data.issues?.[question.name])}
                  />
                )
                : question.type === "checkbox"
                ? (
                  <FormCheckboxQuestion
                    question={question}
                    value={maybeString(data.answers?.[question.name])}
                    issues={maybeArray(data.issues?.[question.name])}
                  />
                )
                : undefined
            )}
          <Button name="Submit" class="float-right" />
        </form>
      )}
    </>
  );
}
