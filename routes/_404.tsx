import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";

export default defineRoute(() => {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <header class="max-w-xl w-full">
        <h1 class="text-3xl font-bold">404 - Page not found</h1>
      </header>
      <main class="max-w-xl w-full markdown markdown-invert markdown-gray italic">
        <p>The page you were looking for doesn't exist.</p>
      </main>
    </>
  );
});
