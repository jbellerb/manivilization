import db, { sql } from "./db/mod.ts";
import { AuthSession, Session } from "./db/schema.ts";
import { oauthClient } from "./oauth.ts";

export async function createAuthSession(session: AuthSession) {
  await sql`
    INSERT INTO auth_sessions VALUES (
      ${session.id},
      ${session.state},
      ${session.verifier},
      ${session.redirect},
      ${session.expires}
    )
  `;
}

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

export async function createSession(session: Session) {
  await sql`
    INSERT INTO sessions VALUES (
      ${session.id},
      ${session.accessToken},
      ${session.refreshToken ?? null},
      ${session.expires},
      ${session.accessExpires ?? null}
    )
  `;
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

export async function updateSession(session: Session) {
  await sql`
    UPDATE sessions SET (access_token, refresh_token, access_expires) = (
      ${session.accessToken},
      ${session.refreshToken ?? null},
      ${session.accessExpires ?? null}
    ) WHERE id = ${session.id}
  `;
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
      : undefined;
  } catch {
    throw new ExpiredSessionError("failed to refresh expired session");
  }

  await updateSession(session);

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
