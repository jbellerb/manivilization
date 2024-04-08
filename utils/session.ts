import db from "./db/mod.ts";
import sql from "./db/sql.ts";
import { AuthSession, Session } from "./db/schema.ts";
import { oauthClient } from "./oauth.ts";

export async function popAuthSession(id: string): Promise<AuthSession> {
  const [session]: [AuthSession?] = await sql`
    DELETE FROM auth_sessions WHERE id = ${id} RETURNING *
  `;

  if (!session) throw new BadSessionError("unknown auth session");
  if (session.expires < new Date()) {
    throw new ExpiredSessionError("auth session has expired");
  }

  return session;
}

export async function getSession(id: string): Promise<Session> {
  const session = await db.sessions.findOne({}, {
    where: (session, { eq }) => eq(session.id, id),
  });

  if (!session) throw new BadSessionError("unknown session");
  if (session.expires < new Date()) {
    deleteSession(id);
    throw new ExpiredSessionError("session has expired");
  }

  if (session.accessExpires && session.accessExpires < new Date()) {
    return refreshSession(session);
  } else {
    return session;
  }
}

export async function deleteSession(id: string) {
  await sql`
    DELETE FROM sessions WHERE id = ${id}
  `;
}

async function refreshSession(
  session: Session,
): Promise<Session> {
  if (!session.refreshToken) {
    throw new ExpiredSessionError("expired session can't be refreshed");
  }

  try {
    const tokens = await oauthClient.refreshToken.refresh(
      session.refreshToken,
    );
    session.accessToken = tokens.accessToken;
    session.refreshToken = tokens.refreshToken ?? session.refreshToken;
    session.accessExpires = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;
  } catch {
    throw new ExpiredSessionError("failed to refresh expired session");
  }

  await db.sessions.update(session);

  return session;
}

export class BadSessionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BadSessionError";
  }
}

export class ExpiredSessionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ExpiredSessionError";
  }
}
