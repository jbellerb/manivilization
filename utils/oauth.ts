import { OAuth2Client } from "oauth2_client/src/oauth2_client.ts";

import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from "./env.ts";

export const oauthClient = (instance?: string) =>
  new OAuth2Client({
    clientId: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    authorizationEndpointUri: "https://discord.com/oauth2/authorize",
    tokenUri: "https://discord.com/api/oauth2/token",
    redirectUri: instance ? `${instance}/oauth/callback` : undefined,
    defaults: { scope: ["identify"] },
  });
