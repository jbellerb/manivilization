import { decodeBase64Url, encodeBase64Url } from "$std/encoding/base64url.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { SELF, STRICT_DYNAMIC, useCSP } from "$fresh/runtime.ts";
import { decode, encode } from "cbor-x";

import type { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";

import UserBanner from "./(_components)/UserBanner.tsx";
import Button from "../../components/Button.tsx";
import CheckboxGroup from "../../islands/CheckboxGroup.tsx";
import ValidatedTextInput from "../../islands/ValidatedTextInput.tsx";
import classnames from "../../utils/classnames.ts";
import db, { FormResponse } from "../../utils/db/mod.ts";
import { assignRole } from "../../utils/discord/guild.ts";
import { toSnowflake } from "../../utils/discord/snowflake.ts";
import { DiscordHTTPError } from "../../utils/discord/http.ts";
import { FormParseError, parseFormData } from "../../utils/form/parse.ts";

import type { FormState as State } from "./_middleware.ts";
import type {
  CheckboxQuestion,
  CheckboxRolesQuestion,
  Question,
  TextQuestion,
} from "../../utils/form/types.ts";
import FormResetter from "../../islands/FormResetter.tsx";

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

export const config: RouteConfig = {
  csp: true,
};

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
      const { answers, issues } = parseFormData(formData, ctx.state.form);
      if (Object.keys(issues).length > 0) {
        const errorData = encodeBase64Url(encode({ answers, issues }));
        const firstError = ctx.state.form.questions?._
          ?.find((question) => question.name in issues)?.name;
        const headers = new Headers({
          Location:
            `/${ctx.state.form.slug}?error=${errorData}#question-${firstError}`,
        });
        return new Response(null, { status: STATUS_CODE.SeeOther, headers });
      }

      let rolesSet = true;
      try {
        const user = ctx.state.user.id;
        if (ctx.state.form.submitterRole) {
          await assignRole(
            ctx.state.instance.guildId,
            user,
            ctx.state.form.submitterRole,
          );
        }
        await Promise.all((ctx.state.form.questions?._ ?? [])
          .flatMap((question) => {
            if (question.type === "checkbox_roles") {
              const roles = answers[question.name]?.split(", ");
              return question.options.map(async ({ label, role }) =>
                roles.includes(label) && await assignRole(
                  ctx.state.instance.guildId,
                  user,
                  toSnowflake(role),
                )
              );
            }
          }));
      } catch (e) {
        rolesSet = false;
        if (!(e instanceof DiscordHTTPError)) throw e;
      }

      const response = new FormResponse(
        ctx.state.form.id,
        ctx.state.user.id,
        ctx.state.user.username,
        rolesSet,
        answers,
      );
      await db.responses.insert(response);

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
      <p class="text-gray-200 font-bold italic leading-relaxed tracking-wide">
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
      aria-labelledby={props.question.comment
        ? `question-${props.question.name}-comment`
        : undefined}
      class="space-y-2"
    >
      {props.question.comment != null && (
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
      <ValidatedTextInput
        name={`question-${props.question.name}`}
        label={props.question.label}
        value={props.value}
        aria-describedby={props.question.comment && props.question.label
          ? `question-${props.question.name}-comment`
          : undefined}
        aria-labelledby={props.question.comment && !props.question.label
          ? `question-${props.question.name}-comment`
          : undefined}
        error={props.issues?.includes("required")}
        required={props.question.required}
      />
    </div>
  );
}

function FormCheckboxQuestion(
  props: {
    question: CheckboxQuestion | CheckboxRolesQuestion;
    value?: string;
    issues?: unknown[];
  },
) {
  const checked = props.value?.split(", ");

  return (
    <CheckboxGroup
      name={props.question.name}
      comment={props.question.comment}
      options={props.question.type === "checkbox_roles"
        ? props.question.options.map((option) => option.label)
        : props.question.options}
      checked={checked}
      required={props.question.required}
      error={props.issues?.includes("required")}
    />
  );
}

export default function FormPage({ data, state }: PageProps<Data, State>) {
  useCSP((csp) => {
    csp.directives.imgSrc = [SELF, "https://cdn.discordapp.com"];
    csp.directives.scriptSrc = [STRICT_DYNAMIC];
    csp.directives.styleSrc = [SELF];
  });

  return (
    <>
      <UserBanner path={`/${state.form.slug}`} user={state.user} />
      {state.user && (
        <form
          method="post"
          class="mt-10 mx-auto max-w-lg w-full space-y-8"
          name={state.form.slug}
        >
          {data.completed && <ResubmitWarning />}
          {state.form.questions &&
            state.form.questions._.map((question: Question) =>
              question.type === "text"
                ? (
                  <FormTextQuestion
                    question={question}
                    value={maybeString(data.answers?.[question.name])}
                    issues={maybeArray(data.issues?.[question.name])}
                  />
                )
                : question.type === "checkbox" ||
                    question.type === "checkbox_roles"
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
          {data.completed && <FormResetter form={state.form.slug} />}
        </form>
      )}
    </>
  );
}
