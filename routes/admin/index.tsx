import { defineRoute } from "$fresh/server.ts";

import type { AdminState } from "./_middleware.ts";

export default defineRoute<AdminState>((_req, { state }) => {
  return (
    <>
      <h1 class="self-center my-auto text-3xl font-semibold">
        Welcome, <span class="italic">{state.user.name}</span>
      </h1>
    </>
  );
});
