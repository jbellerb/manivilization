import { OAuth2Client } from "oauth2_client/src/oauth2_client.ts";

import { PUBLIC_URL } from "../routes/_middleware.ts";

const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") as string;
if (!CLIENT_ID) {
  throw new Error("DISCORD_CLIENT_ID is not set for Discord OAuth");
}
const CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET") as string;
if (!CLIENT_SECRET) {
  throw new Error("DISCORD_CLIENT_SECRET is not set for Discord OAuth");
}

export const oauthClient = new OAuth2Client({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  authorizationEndpointUri: "https://discord.com/oauth2/authorize",
  tokenUri: "https://discord.com/api/oauth2/token",
  redirectUri: PUBLIC_URL ? `${PUBLIC_URL}/oauth/callback` : undefined,
  defaults: { scope: ["identify"] },
});
