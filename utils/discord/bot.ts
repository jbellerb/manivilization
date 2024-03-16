export const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") as string;
if (!BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is not set for the Discord bot");
}
