import { APIGuildMember } from "discord_api_types/payloads/v10/guild.ts";

import { authorizeBot } from "./http.ts";
import { BASE_HEADERS, BASE_URL, DiscordHTTPError } from "./http.ts";
import { DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } from "../env.ts";

export async function assignRole(userId: string, role: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${role}`,
    {
      method: "PUT",
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(DISCORD_BOT_TOKEN),
      }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(`${res.status} ${res.statusText}`);
}

export async function getRoles(userId: string): Promise<string[]> {
  const res = await fetch(
    `${BASE_URL}/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
    {
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(DISCORD_BOT_TOKEN),
      }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(`${res.status} ${res.statusText}`);
  const member: APIGuildMember = await res.json();

  return member.roles;
}
