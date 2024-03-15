import { defineRoute } from "$fresh/server.ts";

export default defineRoute(() => {
  return (
    <>
      <img
        src="/logo.svg"
        width="128"
        height="128"
        alt="the Fresh logo: a sliced lemon dripping with juice"
      />
      <h1>
        "Welcome to Fresh"
      </h1>
    </>
  );
});
