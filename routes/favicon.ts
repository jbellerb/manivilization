import type { Handlers, RouteConfig } from "$fresh/server.ts";

import type { RootState as State } from "./_middleware.ts";

export const config: RouteConfig = {
  routeOverride: "/:favicon(favicon-16x16.png|favicon-32x32.png|favicon.ico)",
};

export const handler: Handlers<void, State> = {
  GET(_req, ctx) {
    let response;
    switch (ctx.params.favicon) {
      case "favicon-16x16.png":
        response = ctx.state.instance.favicon16 &&
          new Response(ctx.state.instance.favicon16, {
            headers: { "Content-Type": "image/png" },
          });
        break;
      case "favicon-32x32.png":
        response = ctx.state.instance.favicon32 &&
          new Response(ctx.state.instance.favicon32, {
            headers: { "Content-Type": "image/png" },
          });
        break;
      case "favicon.ico":
        response = ctx.state.instance.faviconIco &&
          new Response(ctx.state.instance.faviconIco, {
            headers: { "Content-Type": "image/vnd.microsoft.icon" },
          });
        break;
    }

    if (response) return response;

    return ctx.renderNotFound();
  },
};
