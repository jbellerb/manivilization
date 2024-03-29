import { APIGuildMember } from "discord_api_types/payloads/v10/guild.ts";

import { BOT_TOKEN } from "./bot.ts";
import { authorizeBot } from "./http.ts";
import { BASE_HEADERS, BASE_URL, DiscordHTTPError } from "./http.ts";

const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") as string;
if (!GUILD_ID) {
  throw new Error("DISCORD_GUILD_ID is not set for the Discord bot");
}

export async function assignRole(userId: string, role: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/guilds/${GUILD_ID}/members/${userId}/roles/${role}`,
    {
      method: "PUT",
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(BOT_TOKEN),
      }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(`${res.status} ${res.statusText}`);
}

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
