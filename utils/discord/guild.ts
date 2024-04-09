import { APIGuildMember } from "discord_api_types/payloads/v10/guild.ts";

import {
  authorizeBot,
  BASE_HEADERS,
  BASE_URL,
  DiscordHTTPError,
} from "./http.ts";
import { fromSnowflake, toSnowflake } from "./snowflake.ts";
import { DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } from "../env.ts";

export async function assignRole(userId: bigint, role: bigint): Promise<void> {
  const userIdString = fromSnowflake(userId);
  const roleString = fromSnowflake(role);

  const res = await fetch(
    `${BASE_URL}/guilds/${DISCORD_GUILD_ID}/members/${userIdString}/roles/${roleString}`,
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

export async function getRoles(userId: bigint): Promise<bigint[]> {
  const userIdString = fromSnowflake(userId);

  const res = await fetch(
    `${BASE_URL}/guilds/${DISCORD_GUILD_ID}/members/${userIdString}`,
    {
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(DISCORD_BOT_TOKEN),
      }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(`${res.status} ${res.statusText}`);
  const member: APIGuildMember = await res.json();

  return member.roles.map((role) => toSnowflake(role));
}
