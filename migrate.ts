#!/usr/bin/env -S deno run -A

import { join } from "$std/path/mod.ts";

import type { Client, QueryClient } from "postgres/client.ts";

// lower 64 bits of sha3-256("migrations")
const LOCK_ID = -6902354483765142115n;

async function init(db: QueryClient) {
  const res = await db.queryArray`
    CREATE TABLE IF NOT EXISTS migration(
        id SERIAL PRIMARY KEY,
        name character varying,
        date timestamp with time zone NOT NULL DEFAULT now()
    );
  `;
  if (res.warnings.length != 0) {
    console.log("migrations table already exists");
  } else {
    console.log("sucessfully initialized migrations table");
  }
}

async function lock(db: QueryClient) {
  let attempts = 0;
  while (true) {
    const { rows } = await db.queryArray`
      SELECT pg_try_advisory_lock(${LOCK_ID});
    `;
    if (rows[0][0]) {
      break;
    } else {
      attempts += 1;
      if (attempts > 15) {
        throw new Error("failed to get database lock after 15s");
      }
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
}

async function unlock(db: QueryClient) {
  await db.queryArray`
    SELECT pg_advisory_unlock(${LOCK_ID});
  `;
}

async function appliedMigrations(db: QueryClient) {
  const res = await db.queryObject<{ name: string; date: Date }>`
    SELECT name, date FROM migration;
  `;
  return res.rows;
}

async function migrate(db: QueryClient) {
  await lock(db);
  try {
    const applied = new Set(
      (await appliedMigrations(db)).map(({ name }) => name),
    );
    const unapplied = [];
    const migrations_dir = Deno.args[1] ?? "migrations";
    for await (const file of Deno.readDir(migrations_dir)) {
      if (file.isFile && !applied.has(file.name)) {
        const migration = await Deno.readTextFile(
          join(migrations_dir, file.name),
        );
        unapplied.push({ name: file.name, migration });
      }
    }
    unapplied.sort(({ name: a }, { name: b }) =>
      (a < b) ? -1 : (a > b) ? 1 : 0
    );

    if (unapplied.length === 0) {
      console.log("all migrations up to date");
    } else {
      for (const migration of unapplied) {
        const tx = db.createTransaction(migration.name);
        await tx.begin();
        await tx.queryArray`
          INSERT INTO migration (name) VALUES (${migration.name});
        `;
        await tx.queryArray(migration.migration);
        await tx.commit();
        console.log(`successfully applied ${migration.name}`);
      }
    }
  } finally {
    await unlock(db);
  }
}

async function status(db: QueryClient) {
  await lock(db);
  try {
    const applied = await appliedMigrations(db);
    const local = new Set();
    const migrations_dir = Deno.args[1] ?? "migrations";
    for await (const file of Deno.readDir(migrations_dir)) {
      if (file.isFile) {
        local.add(file.name);
      }
    }
    const missing = new Set();
    for (const migration of applied) {
      if (!local.has(migration.name)) {
        missing.add(migration.name);
      }
    }

    console.log(`Total migrations: ${local.size + missing.size}`);
    console.log(`Applied: ${applied.length}`);
    console.log(`Unapplied: ${local.size - (applied.length - missing.size)}`);
    console.log(`Missing: ${missing.size}`);

    applied.sort(({ date: a }, { date: b }) => (a < b) ? 1 : (a > b) ? -1 : 0);
    console.log(`Most recent: ${applied[0].name} at ${applied[0].date}`);
  } finally {
    await unlock(db);
  }
}

function usage() {
  console.log(
    "usage: ./migrate.ts init | migrate [migration_dir] | status [migration_dir]",
  );
}

const commands: Record<string, (db: QueryClient) => Promise<void>> = {
  init: init,
  migrate: migrate,
  status: status,
};

const args = Deno.args;
if (
  args.length !== 0 && commands[args[0]] &&
  ((args[0] === "init" && args.length === 1) ||
    (args[0] !== "init" && args.length <= 2))
) {
  try {
    const DATABASE_URL = Deno.env.get("DATABASE_URL");
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not set for connecting to Postgresql");
    }

    const db = new Client(DATABASE_URL);
    await db.connect();
    await commands[Deno.args[0]](db);
    await db.end();
  } catch (e) {
    console.log(`./migrate.ts: ${e.message}`);
    Deno.exit(1);
  }
} else {
  usage();
  Deno.exit(1);
}
