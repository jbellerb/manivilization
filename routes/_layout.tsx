import { defineLayout } from "$fresh/server.ts";

export default defineLayout((_req, { Component }) => {
  return (
    <body class="flex flex-col items-center min-h-svh px-8 pt-16 pb-8 bg-black text-white">
      <Component />
    </body>
  );
});
