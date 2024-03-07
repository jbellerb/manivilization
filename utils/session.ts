import { Client } from "postgres/client.ts";

export type AuthSession = {
  id: string;
  state: string;
  verifier: string;
  redirect: string;
  expires: Date;
};

export type Session = {
  id: string;
  access_token: string;
  refresh_token?: string;
  expires: Date;
  access_expires?: Date;
};

export async function createAuthSession(client: Client, session: AuthSession) {
  await client.queryArray`
    INSERT INTO auth_sessions VALUES (
      ${session.id},
      ${session.state},
      ${session.verifier},
      ${session.redirect},
      ${session.expires}
    );
  `;
}

export async function popAuthSession(
  client: Client,
  id: string,
): Promise<AuthSession> {
  const { rows } = await client.queryObject<AuthSession>`
    DELETE FROM auth_sessions WHERE id = ${id} RETURNING *;
  `;
  const session = rows[0];

  if (!session) throw new BadSessionError("unknown auth session");
  if (session.expires < new Date()) {
    throw new ExpiredSessionError("auth session has expired");
  }

  return session;
}

export async function createSession(client: Client, session: Session) {
  await client.queryArray`
    INSERT INTO sessions VALUES (
      ${session.id},
      ${session.access_token},
      ${session.refresh_token ?? null},
      ${session.expires},
      ${session.access_expires ?? null}
    );
  `;
}

export async function getSession(client: Client, id: string): Promise<Session> {
  const { rows } = await client.queryObject<Session>`
    SELECT * FROM sessions WHERE id = ${id};
  `;
  const session = rows[0];

  if (!session) throw new BadSessionError("unknown session");
  if (session.expires < new Date()) {
    deleteSession(client, id);
    throw new ExpiredSessionError("session has expired");
  }

  return session;
}

export async function updateSession(client: Client, session: Session) {
  await client.queryArray`
    UPDATE sessions SET (access_token, refresh_token, access_expires) = (
      ${session.access_token},
      ${session.refresh_token ?? null},
      ${session.access_expires ?? null}
    ) WHERE id = ${session.id};
  `;
}

export async function deleteSession(client: Client, id: string) {
  await client.queryArray`
    DELETE FROM sessions WHERE id = ${id};
  `;
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
