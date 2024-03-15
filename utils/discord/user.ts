import { APIUser } from "discord_api_types/payloads/v10/user.ts";

import {
  authorizeUser,
  BASE_HEADERS,
  BASE_IMAGE_URL,
  BASE_URL,
  DiscordHTTPError,
} from "./http.ts";

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
};

export async function getUser(accessToken: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/@me`, {
    headers: new Headers({
      ...BASE_HEADERS,
      ...authorizeUser(accessToken),
    }),
  });
  if (!res.ok) throw new DiscordHTTPError(`${res.status} ${res.statusText}`);
  const user: APIUser = await res.json();

  return {
    id: user.id,
    name: user.global_name ?? user.username,
    username: user.discriminator === "0"
      ? `@${user.username}`
      : `@${user.username}#${user.discriminator}`,
    avatar: `${BASE_IMAGE_URL}/avatars/${user.id}/${user.avatar}.png`,
  };
}
