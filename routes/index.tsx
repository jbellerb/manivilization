import { PageProps } from "$fresh/server.ts";

import type { State } from "./_middleware.ts";

export default function Home({ state }: PageProps<null, State>) {
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src={state.user?.avatar ?? "/logo.svg"}
          width="128"
          height="128"
          alt={state.user
            ? `${state.user.name}'s discord avatar'`
            : "the Fresh logo: a sliced lemon dripping with juice"}
        />
        <h1 class="text-4xl font-bold">
          {state.user ? `Welcome, ${state.user.name}` : "Welcome to Fresh"}
        </h1>
        <p class="my-4">
          Try updating this message in the
          <code class="mx-2">./routes/index.tsx</code> file, and refresh.
        </p>
      </div>
    </div>
  );
}
