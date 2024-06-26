export const DATABASE_URL = Deno.env.get("DATABASE_URL");

export const DENO_MOD_VERSION = Deno.env.get("DENO_MOD_VERSION");

export const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") as string;
if (!DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is not set for the Discord bot");
}

export const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") as string;
if (!DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_CLIENT_ID is not set for Discord OAuth");
}
export const DISCORD_CLIENT_SECRET = Deno.env.get(
  "DISCORD_CLIENT_SECRET",
) as string;
if (!DISCORD_CLIENT_SECRET) {
  throw new Error("DISCORD_CLIENT_SECRET is not set for Discord OAuth");
}

export const DISCORD_INTERACTIONS_VERIFYING_KEY = Deno.env.get(
  "DISCORD_INTERACTIONS_VERIFYING_KEY",
);
export const INTERACTIONS_HOST = Deno.env.get("INTERACTIONS_HOST");

export const SUPER_ADMIN = Deno.env.get("SUPER_ADMIN");
