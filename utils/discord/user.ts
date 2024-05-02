import type { APIUser } from "discord_api_types/payloads/v10/user.ts";

import {
  authorizeUser,
  BASE_HEADERS,
  BASE_IMAGE_URL,
  BASE_URL,
  DiscordHTTPError,
} from "./http.ts";
import { toSnowflake } from "./snowflake.ts";

export type User = {
  id: bigint;
  name: string;
  username: string;
  avatar: string;
};

export function toUsername(user: APIUser): string {
  return user.discriminator === "0"
    ? `@${user.username}`
    : `@${user.username}#${user.discriminator}`;
}

export async function getUser(accessToken: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/@me`, {
    headers: new Headers({
      ...BASE_HEADERS,
      ...authorizeUser(accessToken),
    }),
  });
  if (!res.ok) throw new DiscordHTTPError(await res.json());
  const user: APIUser = await res.json();

  return {
    id: toSnowflake(user.id),
    name: user.global_name ?? user.username,
    username: toUsername(user),
    avatar: `${BASE_IMAGE_URL}/avatars/${user.id}/${user.avatar}.png`,
  };
}
