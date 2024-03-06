import { OAuth2Client } from "oauth2_client/src/oauth2_client.ts";

import getEnvRequired from "./get_env_required.ts";

export const oauthClient = new OAuth2Client({
  clientId: getEnvRequired("DISCORD_CLIENT_ID"),
  clientSecret: getEnvRequired("DISCORD_CLIENT_SECRET"),
  authorizationEndpointUri: "https://discord.com/oauth2/authorize",
  tokenUri: "https://discord.com/api/oauth2/token",
  defaults: { scope: ["identify"] },
});
