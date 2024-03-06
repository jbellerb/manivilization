export default function getEnvRequired(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} is unset`);
  }

  return value;
}
