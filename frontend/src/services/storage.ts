const memoryFallback = new Map<string, string>();
let storageChecked = false;
let storageWorks = false;

function storage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  if (!storageChecked) {
    storageChecked = true;

    try {
      const probe = '__chatflow_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      storageWorks = true;
    } catch {
      storageWorks = false;
    }
  }

  if (storageWorks) return window.localStorage;

  return {
    getItem: (key) => memoryFallback.get(key) ?? null,
    setItem: (key, value) => void memoryFallback.set(key, value),
    removeItem: (key) => void memoryFallback.delete(key),
  };
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function removeKey(key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    return;
  }
}

export function clearMemoryFallback(): void {
  memoryFallback.clear();
}
