import postgres from "postgresjs/mod.js";

import type {
  Notice,
  Options,
  PostgresType,
} from "postgresjs/types/index.d.ts";

import { DATABASE_URL } from "../env.ts";

export let notice: Notice | undefined;
const options = {
  idle_timeout: 20,
  max_lifetime: 5 * 60,
  onnotice: (n) => {
    console.warn(n);
    notice = n;
  },
  types: {
    bigint: postgres.BigInt,
  },
} satisfies Options<Record<string, PostgresType>>;

export default DATABASE_URL
  ? postgres(DATABASE_URL, options)
  : postgres(options);
