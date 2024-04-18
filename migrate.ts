#!/usr/bin/env -S deno run -A

import { join } from "$std/path/mod.ts";
import postgres from "postgresjs/mod.js";

import type { Notice, Options } from "postgresjs/types/index.d.ts";

// lower 64 bits of sha3-256("migrations")
const LOCK_ID = -6902354483765142115n;

const DATABASE_URL = Deno.env.get("DATABASE_URL");

let notice: Notice | undefined = undefined;
const pg_opts: Options<Record<string, never>> = {
  max: 1,
  onnotice: (n) => notice = n,
};
const sql = DATABASE_URL ? postgres(DATABASE_URL, pg_opts) : postgres(pg_opts);

async function init() {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations(
        id SERIAL PRIMARY KEY,
        name character varying,
        date timestamp with time zone NOT NULL DEFAULT now()
    )
  `;
  if (notice) {
    if (notice.code && notice.code === "42P07") {
      console.warn("migrations table already exists");
    } else {
      console.warn(`unexpected: ${notice.message}`);
    }
  } else {
    console.log("sucessfully initialized migrations table");
  }
}

async function lock() {
  let attempts = 0;
  while (true) {
    const [lock] = await sql`
      SELECT pg_try_advisory_lock(${LOCK_ID})
    `;
    if (lock && lock.pg_try_advisory_lock) {
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

async function unlock() {
  await sql`
    SELECT pg_advisory_unlock(${LOCK_ID})
  `;
}

async function appliedMigrations(): Promise<{ name: string; date: Date }[]> {
  return await sql`
    SELECT name, date FROM migrations
  `;
}

async function migrate() {
  await lock();
  try {
    const applied = new Set(
      (await appliedMigrations()).map(({ name }) => name),
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
        await sql.begin(async (sql) => {
          await sql`
            INSERT INTO migrations (name) VALUES (${migration.name})
          `;
          await sql.unsafe(migration.migration);
        });
        console.log(`successfully applied ${migration.name}`);
      }
    }
  } finally {
    await unlock();
  }
}

async function status() {
  await lock();
  try {
    const applied = await appliedMigrations();
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
    await unlock();
  }
}

function usage() {
  console.log(
    "usage: ./migrate.ts init | migrate [migration_dir] | status [migration_dir]",
  );
}

const commands: Record<string, () => Promise<void>> = {
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
    await commands[Deno.args[0]]();
    await sql.end();
  } catch (e) {
    console.log(`./migrate.ts: ${e.message}`);
    Deno.exit(1);
  }
} else {
  usage();
  Deno.exit(1);
}
