import db, { Session } from "./db/mod.ts";
import { oauthClient } from "./oauth.ts";

export async function refreshSession(
  session: Session,
): Promise<boolean> {
  if (!session.refreshToken) return false;

  try {
    const tokens = await oauthClient.refreshToken
      .refresh(session.refreshToken);
    session.accessToken = tokens.accessToken;
    session.refreshToken = tokens.refreshToken ?? session.refreshToken;
    session.accessExpires = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;
  } catch {
    throw new Error("Failed to refresh expired OAuth session");
  }
  await db.sessions.update(session);

  return true;
}
