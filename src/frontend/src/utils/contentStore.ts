/**
 * ALVRA Content Store
 * Stores website content (text + images) in localStorage.
 * All writes dispatch a custom event so the main site re-renders instantly.
 */

const CONTENT_PREFIX = "alvra_v2_";
const UPDATE_EVENT = "alvra_content_updated";

// ─── Read ─────────────────────────────────────────────────────────────────────

export function readAll(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CONTENT_PREFIX)) {
        const shortKey = k.slice(CONTENT_PREFIX.length);
        result[shortKey] = localStorage.getItem(k) ?? "";
      }
    }
  } catch {
    // storage not available
  }
  return result;
}

export function readKey(key: string): string | undefined {
  try {
    return localStorage.getItem(CONTENT_PREFIX + key) ?? undefined;
  } catch {
    return undefined;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Save a single key-value pair.
 * Throws if the value is too large to store.
 */
export function writeKey(key: string, value: string): void {
  const storageKey = CONTENT_PREFIX + key;
  try {
    localStorage.setItem(storageKey, value);
    notifyUpdate();
  } catch (_e) {
    // Try to free space by removing this key if it exists, then throw
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    throw new Error(
      "Image is too large for browser storage. Please use a smaller image (under 1MB).",
    );
  }
}

/**
 * Save multiple key-value pairs atomically.
 * Rolls back on any error.
 */
export function writeMany(updates: Record<string, string>): void {
  const written: string[] = [];
  try {
    for (const [key, value] of Object.entries(updates)) {
      localStorage.setItem(CONTENT_PREFIX + key, value);
      written.push(key);
    }
    notifyUpdate();
  } catch (_e) {
    // Rollback
    for (const key of written) {
      try {
        localStorage.removeItem(CONTENT_PREFIX + key);
      } catch {
        /* ignore */
      }
    }
    throw new Error(
      "Failed to save changes. Image may be too large — try a smaller file (under 1MB).",
    );
  }
}

// ─── Clear ────────────────────────────────────────────────────────────────────

export function clearAll(): void {
  const toRemove: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CONTENT_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) {
      localStorage.removeItem(k);
    }
    notifyUpdate();
  } catch {
    // ignore
  }
}

// ─── Event ────────────────────────────────────────────────────────────────────

function notifyUpdate() {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function onContentUpdate(cb: () => void): () => void {
  window.addEventListener(UPDATE_EVENT, cb);
  window.addEventListener("storage", cb); // cross-tab
  return () => {
    window.removeEventListener(UPDATE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
