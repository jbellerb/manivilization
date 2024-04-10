import db from "./db/mod.ts";
import { oauthClient } from "./oauth.ts";

import type { Session } from "./db/mod.ts";

export async function refreshSession(session: Session): Promise<void> {
  if (!session.refreshToken) {
    throw new SessionRefreshError("No token to refresh session with");
  }

  try {
    const tokens = await oauthClient().refreshToken
      .refresh(session.refreshToken);
    session.accessToken = tokens.accessToken;
    session.refreshToken = tokens.refreshToken ?? session.refreshToken;
    session.accessExpires = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;
  } catch {
    throw new SessionRefreshError("Failed to refresh expired OAuth session");
  }

  await db.sessions.update(session);
}

export class SessionRefreshError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "SessionRefreshError";
  }
}
