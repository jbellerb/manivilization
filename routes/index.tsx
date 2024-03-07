import { PageProps } from "$fresh/server.ts";

import type { State } from "./_middleware.ts";

export default function Home({ state }: PageProps<null, State>) {
  return (
    <>
      <img
        src={state.user?.avatar ?? "/logo.svg"}
        width="128"
        height="128"
        alt={state.user
          ? `${state.user.name}'s discord avatar'`
          : "the Fresh logo: a sliced lemon dripping with juice"}
      />
      <h1>
        {state.user ? `Welcome, ${state.user.name}` : "Welcome to Fresh"}
      </h1>
    </>
  );
}
