import { defineApp } from "$fresh/server.ts";

export default defineApp((_req, { Component }) => {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex" />
        <title>Manivilization</title>
      </head>
      <Component />
    </html>
  );
});
