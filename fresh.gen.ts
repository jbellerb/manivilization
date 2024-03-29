// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_slug_layout from "./routes/[slug]/_layout.tsx";
import * as $_slug_middleware from "./routes/[slug]/_middleware.ts";
import * as $_slug_index from "./routes/[slug]/index.tsx";
import * as $_slug_success from "./routes/[slug]/success.tsx";
import * as $_404 from "./routes/_404.tsx";
import * as $_500 from "./routes/_500.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $admin_layout from "./routes/admin/_layout.tsx";
import * as $admin_middleware from "./routes/admin/_middleware.ts";
import * as $admin_forms_form_id_layout from "./routes/admin/forms/[form_id]/_layout.tsx";
import * as $admin_forms_form_id_middleware from "./routes/admin/forms/[form_id]/_middleware.ts";
import * as $admin_forms_form_id_index from "./routes/admin/forms/[form_id]/index.tsx";
import * as $admin_forms_form_id_results from "./routes/admin/forms/[form_id]/results.tsx";
import * as $admin_forms_new from "./routes/admin/forms/new.ts";
import * as $admin_index from "./routes/admin/index.tsx";
import * as $oauth_callback from "./routes/oauth/callback.ts";
import * as $oauth_login from "./routes/oauth/login.ts";
import * as $oauth_logout from "./routes/oauth/logout.ts";
import * as $GrowableTextArea from "./islands/GrowableTextArea.tsx";
import * as $QuestionEditor from "./islands/QuestionEditor.tsx";
import * as $ResultsTable from "./islands/ResultsTable.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/[slug]/_layout.tsx": $_slug_layout,
    "./routes/[slug]/_middleware.ts": $_slug_middleware,
    "./routes/[slug]/index.tsx": $_slug_index,
    "./routes/[slug]/success.tsx": $_slug_success,
    "./routes/_404.tsx": $_404,
    "./routes/_500.tsx": $_500,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/admin/_layout.tsx": $admin_layout,
    "./routes/admin/_middleware.ts": $admin_middleware,
    "./routes/admin/forms/[form_id]/_layout.tsx": $admin_forms_form_id_layout,
    "./routes/admin/forms/[form_id]/_middleware.ts":
      $admin_forms_form_id_middleware,
    "./routes/admin/forms/[form_id]/index.tsx": $admin_forms_form_id_index,
    "./routes/admin/forms/[form_id]/results.tsx": $admin_forms_form_id_results,
    "./routes/admin/forms/new.ts": $admin_forms_new,
    "./routes/admin/index.tsx": $admin_index,
    "./routes/oauth/callback.ts": $oauth_callback,
    "./routes/oauth/login.ts": $oauth_login,
    "./routes/oauth/logout.ts": $oauth_logout,
  },
  islands: {
    "./islands/GrowableTextArea.tsx": $GrowableTextArea,
    "./islands/QuestionEditor.tsx": $QuestionEditor,
    "./islands/ResultsTable.tsx": $ResultsTable,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
