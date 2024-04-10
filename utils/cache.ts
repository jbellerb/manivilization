type StorageEntry = {
  value: unknown;
  expiry?: Date;
};

const storage = new Map<string, StorageEntry>();

export function getCache(
  namespace: string,
  key: string,
): unknown | undefined {
  const cacheKey = `${namespace}-${key}`;
  const cached = storage.get(cacheKey);
  if (cached) {
    if (!cached.expiry || new Date() < cached.expiry) {
      return cached.value;
    } else {
      storage.delete(cacheKey);
    }
  }
}

export function setCache(
  namespace: string,
  key: string,
  value: unknown,
  ttl?: number,
) {
  if (value !== undefined) {
    storage.set(`${namespace}-${key}`, {
      value: value,
      expiry: ttl != null ? new Date(Date.now() + ttl) : undefined,
    });
  }
}

export function invalidateCache(namespace: string, key: string): boolean {
  return storage.delete(`${namespace}-${key}`);
}

export async function memo<T>(
  namespace: string,
  key: string,
  fn: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  const cached = getCache(namespace, key);
  if (cached) return cached as T;

  const value = await fn();
  setCache(namespace, key, value, ttl);

  return value;
}
