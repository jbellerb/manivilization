import { deleteCookie } from "$std/http/cookie.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

import Button from "../components/Button.tsx";
import Checkbox from "../components/Checkbox.tsx";
import TextInput from "../components/TextInput.tsx";
import { getUser } from "../utils/discord/user.ts";
import { BadFormError, getFormBySlug } from "../utils/form.ts";
import {
  BadSessionError,
  ExpiredSessionError,
  getSession,
} from "../utils/session.ts";

import type { RootState } from "./_middleware.ts";
import type { User } from "../utils/discord/user.ts";
import type { Form, Question } from "../utils/form.ts";

type Data = {
  form: Form;
  user?: User;
};

export const handler: Handlers<Data, RootState> = {
  async GET(_req, ctx) {
    try {
      const form = await getFormBySlug(ctx.state.client, ctx.params.slug);
      let user;

      if (ctx.state.sessionToken) {
        try {
          const session = await getSession(
            ctx.state.client,
            ctx.state.sessionToken,
          );
          user = await getUser(session.access_token);
        } catch (e) {
          if (
            !(e instanceof BadSessionError || e instanceof ExpiredSessionError)
          ) {
            throw e;
          }
        }
      }

      const res = await ctx.render({ form, user });
      if (ctx.state.sessionToken && !user) {
        deleteCookie(res.headers, "__Host-session");
      }
      return res;
    } catch (e) {
      if (e instanceof BadFormError) return ctx.renderNotFound();
      throw e;
    }
  },
};

export default ({ data }: PageProps<Data>) => {
  const form = data.user
    ? (
      <>
        <section class="flex justify-between items-center">
          <div class="flex items-center">
            <img
              src={data.user.avatar}
              width="48"
              height="48"
              alt={`Discord avatar of ${data.user.name}`}
              class="rounded-full"
            />
            <div class="ml-2">
              <span class="block text-lg">{data.user.name}</span>
              <span class="block text-sm text-gray-400">
                {data.user.username}
              </span>
            </div>
          </div>
          <a
            href={`/oauth/logout?redirect=/${data.form.slug}`}
            class="px-4 py-1 font-semibold tracking-wide border-2 border-gray-600 hover:border-gray-500 focus-visible:border-white active:border-white rounded-full transition-border-color"
          >
            Sign out
          </a>
        </section>
        <section class="mt-8 mx-auto max-w-lg">
          <form
            method="post"
            class="w-full space-y-8"
          >
            {data.form.questions && data.form.questions.questions.map((
              question: Question,
            ) =>
              question.type === "text"
                ? <TextInput name={question.name} label={question.label} />
                : question.type === "checkbox"
                ? (
                  <fieldset class="space-y-2">
                    <legend class="text-lg">{question.name}</legend>
                    {question.options.map((option, idx) => (
                      <Checkbox
                        name={question.name}
                        label={option}
                        id={`checkbox-${question.name}-${idx}`}
                      />
                    ))}
                  </fieldset>
                )
                : undefined
            )}
            <Button name="Submit" class="float-right" />
          </form>
        </section>
      </>
    )
    : (
      <section class="flex flex-col items-center mt-4">
        <span class="text-lg">
          Connect with Discord to fill out the form
        </span>
        <a
          href={`/oauth/login?redirect=/${data.form.slug}`}
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

  return (
    <>
      <div class="flex flex-col min-h-screen items-center px-8 py-16 bg-black text-white">
        <header class="max-w-xl w-full">
          <h1 class="pb-1 text-3xl font-bold">
            {data.form.name}
          </h1>
          <p class="mt-3 italic">{data.form.description}</p>
        </header>
        <main class="max-w-xl w-full mt-8">
          {form}
        </main>
      </div>
    </>
  );
};
