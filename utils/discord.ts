import { APIUser } from "discord_api_types/payloads/v10/user.ts";

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  roles?: string[];
};

function baseHeaders(accessToken: string): Headers {
  return new Headers({
    UserAgent: "Manivilization (v0.1.0)",
    Authorization: `Bearer ${accessToken}`,
  });
}

export async function getUser(accessToken: string): Promise<User> {
  const res = await fetch(
    "https://discord.com/api/v10/users/@me",
    {
      headers: baseHeaders(accessToken),
    },
  );
  if (!res.ok) throw new DiscordError(`${res.status} ${res.statusText}`);
  const user: APIUser = await res.json();

  return {
    id: user.id,
    name: user.global_name ?? user.username,
    username: user.discriminator === "0"
      ? `@${user.username}`
      : `@${user.username}#${user.discriminator}`,
    avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
  };
}

export class DiscordError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DiscordError";
  }
}
