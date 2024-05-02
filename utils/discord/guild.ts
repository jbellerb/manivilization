import { APIGuildMember } from "discord_api_types/payloads/v10/guild.ts";

import {
  authorizeBot,
  BASE_HEADERS,
  BASE_URL,
  DiscordHTTPError,
} from "./http.ts";
import { fromSnowflake, toSnowflake } from "./snowflake.ts";
import { DISCORD_BOT_TOKEN } from "../env.ts";

export async function assignRole(
  guild: bigint,
  userId: bigint,
  role: bigint,
): Promise<void> {
  const guildString = fromSnowflake(guild);
  const userIdString = fromSnowflake(userId);
  const roleString = fromSnowflake(role);

  const res = await fetch(
    `${BASE_URL}/guilds/${guildString}/members/${userIdString}/roles/${roleString}`,
    {
      method: "PUT",
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(DISCORD_BOT_TOKEN),
      }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(await res.json());
}

export async function getMember(
  guild: bigint,
  userId: bigint,
): Promise<APIGuildMember> {
  const guildString = fromSnowflake(guild);
  const userIdString = fromSnowflake(userId);

  const res = await fetch(
    `${BASE_URL}/guilds/${guildString}/members/${userIdString}`,
    {
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(DISCORD_BOT_TOKEN),
      }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(await res.json());
  return await res.json();
}

export async function getRoles(
  guild: bigint,
  userId: bigint,
): Promise<bigint[]> {
  const member = await getMember(guild, userId);

  return member.roles.map((role) => toSnowflake(role));
}

export async function setRoles(
  guild: bigint,
  userId: bigint,
  roles: bigint[],
): Promise<void> {
  const guildString = fromSnowflake(guild);
  const userIdString = fromSnowflake(userId);

  const res = await fetch(
    `${BASE_URL}/guilds/${guildString}/members/${userIdString}`,
    {
      method: "PATCH",
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(DISCORD_BOT_TOKEN),
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ roles: roles.map((role) => fromSnowflake(role)) }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(await res.json());
}

export async function removeRole(
  guild: bigint,
  userId: bigint,
  role: bigint,
): Promise<void> {
  const guildString = fromSnowflake(guild);
  const userIdString = fromSnowflake(userId);
  const roleString = fromSnowflake(role);

  const res = await fetch(
    `${BASE_URL}/guilds/${guildString}/members/${userIdString}/roles/${roleString}`,
    {
      method: "DELETE",
      headers: new Headers({
        ...BASE_HEADERS,
        ...authorizeBot(DISCORD_BOT_TOKEN),
      }),
    },
  );
  if (!res.ok) throw new DiscordHTTPError(await res.json());
}
