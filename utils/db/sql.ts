import { decodeHex, encodeHex } from "$std/encoding/hex.ts";
import postgres from "postgresjs/mod.js";

import type {
  Fragment,
  JSONValue,
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
    bytea: {
      to: 17,
      from: [17],
      serialize: (x: ArrayBufferLike) => "\\x" + encodeHex(x),
      parse: (x: string) => decodeHex(x.slice(2)).buffer,
    },
    json: {
      to: 114,
      from: [114, 3802],
      serialize: (x: Record<string, JSONValue>) => JSON.stringify(x),
      parse: (x: string) => JSON.parse(x) as Record<string, JSONValue>,
    },
  },
} satisfies Options<Record<string, PostgresType>>;

const sql = DATABASE_URL ? postgres(DATABASE_URL, options) : postgres(options);
export default sql;

export type SerializableValue = Exclude<
  Parameters<typeof sql>[1],
  Fragment | Fragment[]
>;
