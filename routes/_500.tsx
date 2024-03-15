import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";

export default defineRoute(() => {
  return (
    <>
      <Head>
        <title>500 - Internal server error</title>
      </Head>
      <h1>500 - Internal server error</h1>
      <p>Something went wrong while processing your request.</p>
    </>
  );
});
