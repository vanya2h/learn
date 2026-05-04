type Envelope<T> = { v: number; data: T };

export function createVersionedStorage<T>(prefix: string, version: number) {
  return {
    get(key: string): T | null {
      try {
        const raw = localStorage.getItem(prefix + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Envelope<T>;
        if (parsed.v !== version) return null;
        return parsed.data;
      } catch {
        return null;
      }
    },
    set(key: string, value: T): void {
      try {
        localStorage.setItem(prefix + key, JSON.stringify({ v: version, data: value }));
      } catch {
        // storage full or unavailable
      }
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(prefix + key);
      } catch {
        // ignore
      }
    },
  };
}
