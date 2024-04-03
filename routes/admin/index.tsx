import { defineRoute } from "$fresh/server.ts";

import type { AdminState as State } from "./_middleware.ts";

export default defineRoute<State>((_req, { state }) => {
  return (
    <>
      <h1 class="self-center my-auto text-3xl font-semibold">
        Welcome, <span class="italic">{state.user.name}</span>
      </h1>
    </>
  );
});
