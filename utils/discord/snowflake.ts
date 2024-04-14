const MAX_I64 = 9223372036854775807n;
const RANGE_U64 = 18446744073709551616n;

export function toSnowflake(snowflake: string): bigint {
  let int = BigInt(snowflake);
  if (int < 0 || int >= RANGE_U64) {
    throw new RangeError("snowflake out of range");
  }

  if (int > MAX_I64) int -= RANGE_U64;
  return int;
}

export function fromSnowflake(snowflake: bigint): string {
  if (snowflake < 0n) snowflake += RANGE_U64;
  return snowflake.toString();
}
