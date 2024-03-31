import { STATUS_CODE } from "$std/http/status.ts";
import type { Handlers, PageProps } from "$fresh/server.ts";

import Button from "../../components/Button.tsx";
import Checkbox from "../../components/Checkbox.tsx";
import TextInput from "../../components/TextInput.tsx";
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
  FormResponse,
  Question,
  TextQuestion,
} from "../../utils/form/types.ts";

type Data = {
  recentResponse?: FormResponse;
};

export const handler: Handlers<Data, State> = {
  async GET(_req, ctx) {
    let responses: FormResponse[] = [];
    if (ctx.state.user) {
      responses = await getUserFormResponses(
        ctx.state.client,
        ctx.state.form.id,
        ctx.state.user.id,
      );
    }

    return ctx.render({
      recentResponse: responses[0],
    });
  },
  async POST(req, ctx) {
    if (!ctx.state.user) {
      return new Response("Forbidden", { status: STATUS_CODE.Forbidden });
    }

    const formData = await req.formData();
    try {
      const answers = parseFormData(formData, ctx.state.form);
      const responseId = await createResponse(
        ctx.state.client,
        ctx.state.form,
        ctx.state.user,
        answers,
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
  props: { question: TextQuestion; response?: string },
) {
  return (
    <div
      aria-role="group"
      aria-labelledby={props.question.comment &&
        `question-${props.question.name}-comment`}
      class="space-y-2"
    >
      {props.question.comment && (
        <div>
          <label
            class="block text-lg"
            id={`question-${props.question.name}-comment`}
          >
            {props.question.comment}
          </label>
          {props.question.required && (
            <span class="block text-sm font-semibold text-gray-400">
              * Required
            </span>
          )}
        </div>
      )}
      <TextInput
        name={`question-${props.question.name}`}
        label={props.question.label}
        value={props.response}
        aria-describedby={props.question.comment &&
          `question-${props.question.name}-comment`}
        required={props.question.required}
      />
    </div>
  );
}

function FormCheckboxQuestion(
  props: { question: CheckboxQuestion; response?: string },
) {
  const checked = props.response?.split(", ");

  return (
    <fieldset class="space-y-2">
      {props.question.comment && (
        <div class="mb-3">
          <legend class="text-lg">{props.question.comment}</legend>
          {props.question.required && (
            <span class="block text-sm font-semibold text-gray-400">
              * Required
            </span>
          )}
        </div>
      )}
      {props.question.options.map((option, idx) => (
        <Checkbox
          name={`question-${props.question.name}`}
          id={`checkbox-${props.question.name}-${idx}`}
          label={option}
          checked={checked?.includes(option)}
          value={option}
          required={props.question.required}
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
        {data.recentResponse && (
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
                  response={data.recentResponse?.response?.[question.name]}
                />
              )
              : question.type === "checkbox"
              ? (
                <FormCheckboxQuestion
                  question={question}
                  response={data.recentResponse?.response?.[question.name]}
                />
              )
              : undefined
          )}
        <Button name="Submit" class="float-right" />
      </form>
    </>
  );
}
