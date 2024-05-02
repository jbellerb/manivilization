import type { RESTError } from "discord_api_types/payloads/common.ts";

import { DENO_MOD_VERSION } from "../env.ts";

export const BASE_URL = "https://discord.com/api/v10";
export const BASE_IMAGE_URL = "https://cdn.discordapp.com";

export const BASE_HEADERS = {
  UserAgent: `Manivilization (v${DENO_MOD_VERSION ?? "dev"})`,
};

export function authorizeBot(botToken: string): HeadersInit {
  return {
    "Authorization": `Bot ${botToken}`,
  };
}

export function authorizeUser(accessToken: string): HeadersInit {
  return {
    "Authorization": `Bearer ${accessToken}`,
  };
}

export class DiscordHTTPError extends Error {
  constructor(message?: string | RESTError) {
    const msg = message &&
      (typeof message === "string"
        ? message
        : `[${message.code}] ${message.message}${
          message.errors ? `: ${JSON.stringify(message.errors)}` : ""
        }`);
    super(msg);
    this.name = "DiscordHTTPError";
  }
}
