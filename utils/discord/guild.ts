import { APIGuildMember } from "discord_api_types/payloads/v10/guild.ts";

import { BOT_TOKEN } from "./bot.ts";
import { authorizeBot } from "./http.ts";
import getEnvRequired from "../get_env_required.ts";
import { BASE_HEADERS, BASE_URL, DiscordHTTPError } from "./http.ts";

const GUILD_ID = getEnvRequired("DISCORD_GUILD_ID");

export async function getRoles(userId: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/guilds/${GUILD_ID}/members/${userId}`, {
    headers: new Headers({
      ...BASE_HEADERS,
      ...authorizeBot(BOT_TOKEN),
    }),
  });
  if (!res.ok) throw new DiscordHTTPError(`${res.status} ${res.statusText}`);
  const member: APIGuildMember = await res.json();

  return member.roles;
}
