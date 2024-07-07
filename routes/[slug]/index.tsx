import { decodeBase64Url, encodeBase64Url } from "$std/encoding/base64url.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { SELF, STRICT_DYNAMIC, useCSP } from "$fresh/runtime.ts";
import { decode, encode } from "cbor-x";

import type { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";

import FormCheckboxQuestion from "./(_components)/FormCheckboxQuestion.tsx";
import FormRadioQuestion from "./(_components)/FormRadioQuestion.tsx";
import FormTextQuestion from "./(_components)/FormTextQuestion.tsx";
import UserBanner from "./(_components)/UserBanner.tsx";
import Button from "../../components/Button.tsx";
import db, { FormResponse } from "../../utils/db/mod.ts";
import { getRoles, setRoles } from "../../utils/discord/guild.ts";
import { DiscordHTTPError } from "../../utils/discord/http.ts";
import { FormParseError, parseFormData } from "../../utils/form/parse.ts";
import { updateRoles } from "../../utils/form/roles.ts";

import type { FormState as State } from "./_middleware.ts";
import type { Question } from "../../utils/form/types.ts";
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
  async GET(_req, ctx) {
    const error = ctx.url.searchParams.get("error");

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
        const guildRoles = await getRoles(
          ctx.state.instance.guildId,
          ctx.state.user.id,
        );
        await setRoles(
          ctx.state.instance.guildId,
          ctx.state.user.id,
          updateRoles(guildRoles, [{
            form: ctx.state.form,
            response: answers,
          }]),
        );
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
        console.error(e);
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
            state.form.questions._.map((question: Question) => {
              const info = {
                value: maybeString(data.answers?.[question.name]),
                issues: maybeArray(data.issues?.[question.name]),
              };
              return (question.type === "text"
                ? <FormTextQuestion question={question} {...info} />
                : question.type === "checkbox" ||
                    question.type === "checkbox_roles"
                ? <FormCheckboxQuestion question={question} {...info} />
                : question.type === "radio"
                ? <FormRadioQuestion question={question} {...info} />
                : undefined);
            })}
          <Button name="Submit" class="float-right" />
          {data.completed && <FormResetter form={state.form.slug} />}
        </form>
      )}
    </>
  );
}
