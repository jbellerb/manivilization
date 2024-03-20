import { defineLayout } from "$fresh/server.ts";

export default defineLayout((_req, { Component }) => {
  return (
    <body class="flex flex-col items-center px-8 py-16 bg-black text-white">
      <Component />
    </body>
  );
});
