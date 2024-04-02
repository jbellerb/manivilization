import { decodeBase64Url, encodeBase64Url } from "$std/encoding/base64url.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { decode, encode } from "cbor-x";

import type { Handlers, PageProps } from "$fresh/server.ts";

import Button from "../../components/Button.tsx";
import Checkbox from "../../components/Checkbox.tsx";
import TextInput from "../../components/TextInput.tsx";
import classnames from "../../utils/classnames.ts";
import { assignRole } from "../../utils/discord/guild.ts";
import { DiscordHTTPError } from "../../utils/discord/http.ts";
import {
  createResponse,
  FormParseError,
  getUserFormResponses,
  parseFormData,
} from "../../utils/form/mod.ts";

import type { FormState as State } from "./_middleware.ts";
import type { User } from "../../utils/discord/user.ts";
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
      const response = (await getUserFormResponses(
        ctx.state.client,
        ctx.state.form.id,
        ctx.state.user.id,
      ))?.[0];
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

      const responseId = await createResponse(
        ctx.state.client,
        ctx.state.form,
        ctx.state.user,
        answers.answers,
      );

      if (ctx.state.form.submitter_role) {
        try {
          await assignRole(ctx.state.user.id, ctx.state.form.submitter_role);
        } catch (e) {
          if (e instanceof DiscordHTTPError) console.log(e);
          else throw e;
        }
      }

      const headers = new Headers({
        Location: `/${ctx.state.form.slug}/success?response=${responseId}`,
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

function LoginButton(props: { path: string }) {
  return (
    <section class="flex flex-col items-center mt-4">
      <span class="text-lg">
        Connect with Discord to fill out the form
      </span>
      <a
        href={`/oauth/login?redirect=${props.path}`}
        class="mt-4 px-4 py-2 flex items-center border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-lg transition-border-color"
      >
        {/* svg from https://discord.com/branding */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-9.02 -24.41 145.18 145.18"
          class="w-10 h-10"
        >
          <path
            fill="currentColor"
            d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
          />
        </svg>
        <div class="ml-4">
          Sign in with
          <br />
          <span class="text-xl font-semibold">Discord</span>
        </div>
      </a>
    </section>
  );
}

function UserBanner(props: { path: string; user: User }) {
  return (
    <section class="flex justify-between items-center">
      <article
        aria-label={`Filling out form as ${props.user.username}`}
        class="flex items-center"
      >
        <img
          src={props.user.avatar}
          width="48"
          height="48"
          alt={`Discord avatar of ${props.user.name}`}
          class="rounded-full"
        />
        <div class="ml-2">
          <span class="block text-lg">{props.user.name}</span>
          <span class="block text-sm text-gray-400">
            {props.user.username}
          </span>
        </div>
      </article>
      <a
        href={`/oauth/logout?redirect=${props.path}`}
        class="px-4 py-1 font-semibold tracking-wide outline-none border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color"
      >
        Sign out
      </a>
    </section>
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
  if (!state.user) {
    return <LoginButton path={`/${state.form.slug}`} />;
  }

  return (
    <>
      <UserBanner path={`/${state.form.slug}`} user={state.user} />
      <form
        method="post"
        class="mt-10 mx-auto max-w-lg w-full space-y-8"
      >
        {data.completed && (
          <aside class="flex items-center">
            <div class="mr-4 text-3xl" aria-label="Alert">
              !
            </div>
            <p class="markdown markdown-invert markdown-gray font-bold italic tracking-wide">
              You've already filled out this form. If you would like to change
              your response, please edit it and resubmit.
            </p>
          </aside>
        )}
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
    </>
  );
}
