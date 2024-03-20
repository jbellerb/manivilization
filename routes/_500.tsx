import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";

export default defineRoute(() => {
  return (
    <>
      <Head>
        <title>500 - Internal server error</title>
      </Head>
      <header class="max-w-xl w-full">
        <h1 class="text-3xl font-bold">500 - Internal server error</h1>
      </header>
      <main class="max-w-xl w-full markdown markdown-invert markdown-gray italic">
        <p>Something went wrong while processing your request.</p>
      </main>
    </>
  );
});
