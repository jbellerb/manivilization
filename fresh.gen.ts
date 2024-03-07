// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_500 from "./routes/_500.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $admin_middleware from "./routes/admin/_middleware.ts";
import * as $admin_index from "./routes/admin/index.tsx";
import * as $index from "./routes/index.tsx";
import * as $oauth_callback from "./routes/oauth/callback.ts";
import * as $oauth_login from "./routes/oauth/login.ts";
import * as $oauth_logout from "./routes/oauth/logout.ts";

import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_500.tsx": $_500,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/admin/_middleware.ts": $admin_middleware,
    "./routes/admin/index.tsx": $admin_index,
    "./routes/index.tsx": $index,
    "./routes/oauth/callback.ts": $oauth_callback,
    "./routes/oauth/login.ts": $oauth_login,
    "./routes/oauth/logout.ts": $oauth_logout,
  },
  islands: {},
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;