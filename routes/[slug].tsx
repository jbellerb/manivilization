import { Handlers, PageProps } from "$fresh/server.ts";

import Button from "../components/Button.tsx";
import Checkbox from "../components/Checkbox.tsx";
import TextInput from "../components/TextInput.tsx";
import { BadFormError, getFormBySlug } from "../utils/form.ts";

import type { State } from "./_middleware.ts";
import type { User } from "../utils/discord/user.ts";
import type { Form, Question } from "../utils/form.ts";

function LogIn() {
  return <section></section>;
}

type QuestionsPrompts = {
  user: User;
  form: Form;
};

function Questions({ user, form }: QuestionsPrompts) {
  return (
    <>
      <section class="flex justify-center items-start space-x-4">
        <span>Submitting as:</span>
        <div class="flex items-center">
          <img
            src={user.avatar}
            width="48"
            height="48"
            alt={`Discord avatar of ${user.name}`}
            class="rounded-full"
          />
          <div class="ml-2">
            <span class="block text-lg">{user.name}</span>
            <span class="block text-sm text-gray-400">{user.username}</span>
          </div>
        </div>
      </section>
      <section class="mt-8 mx-auto max-w-lg">
        <form
          method="post"
          class="w-full space-y-8"
        >
          {form.questions && form.questions.questions.map((
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
  );
}

type Data = {
  form: Form;
};

export const handler: Handlers<Data, State> = {
  async GET(_req, ctx) {
    try {
      const form = await getFormBySlug(ctx.state.client, ctx.params.slug);
      return await ctx.render({ form });
    } catch (e) {
      if (e instanceof BadFormError) return ctx.renderNotFound();
      throw e;
    }
  },
};

export default function Form({ data, state }: PageProps<Data, State>) {
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
          {state.user
            ? <Questions user={state.user} form={data.form} />
            : <LogIn />}
        </main>
      </div>
    </>
  );
}
