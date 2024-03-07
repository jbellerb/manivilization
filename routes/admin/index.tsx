import { PageProps } from "$fresh/server.ts";

import type { State } from "./_middleware.ts";

export default function Home({ state }: PageProps<null, State>) {
  return (
    <>
      <h1>{`Welcome, ${state.user.name}`}</h1>
      {state.user.roles?.map((role) => <p>{role}</p>)}
    </>
  );
}
