import { PageProps } from "$fresh/server.ts";

import type { State } from "./_middleware.ts";

export default function Home({ state }: PageProps<null, State>) {
  return (
    <>
      <h1 class="self-center mt-auto mb-auto text-3xl font-semibold">
        Welcome, <span class="italic">{state.user.name}</span>
      </h1>
    </>
  );
}
