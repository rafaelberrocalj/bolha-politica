import { PROFILES, type Profile } from "./config";

export type { Profile };

export const REMOTE_PROFILES_URL =
  "https://raw.githubusercontent.com/rafaelberrocalj/bolha-politica/main/data/profiles.json";
export const SUPPORTED_SCHEMA_VERSION = 1;
export const PROFILES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const REMOTE_FETCH_TIMEOUT_MS = 5_000;

const DB_NAME = "minha-bolha-politica";
const DB_VERSION = 2;
const CACHE_STORE_NAME = "profiles-cache";
const STATE_STORE_NAME = "extension-state";
const CACHE_RECORD_KEY = "profiles";

type CacheRecord = {
  fetchedAt: number;
  version: number;
  updatedAt: string;
  profiles: Profile[];
};

type FetchResult = {
  version: number;
  updatedAt: string;
  profiles: Profile[];
};

export async function getProfiles(): Promise<Profile[]> {
  const cached = await safeReadCache();
  if (cached !== null) {
    const age = Date.now() - cached.fetchedAt;
    if (
      age >= 0 &&
      age < PROFILES_CACHE_TTL_MS &&
      cached.version === SUPPORTED_SCHEMA_VERSION
    ) {
      return cached.profiles;
    }
  }

  const fetched = await safeFetchRemote();
  if (fetched === null) {
    return PROFILES;
  }

  await safeWriteCache({
    fetchedAt: Date.now(),
    version: fetched.version,
    updatedAt: fetched.updatedAt,
    profiles: fetched.profiles,
  });
  return fetched.profiles;
}

async function safeFetchRemote(): Promise<FetchResult | null> {
  let response: Response;
  try {
    response = await fetch(REMOTE_PROFILES_URL, {
      signal: AbortSignal.timeout(REMOTE_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    console.warn("[profiles-source] Remote fetch failed:", error);
    return null;
  }

  if (!response.ok) {
    console.warn(
      `[profiles-source] Remote fetch non-2xx status: ${response.status}`,
    );
    return null;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    console.warn("[profiles-source] Remote JSON parse failed:", error);
    return null;
  }

  return validatePayload(payload);
}

function validatePayload(payload: unknown): FetchResult | null {
  if (payload === null) {
    return null;
  }
  if (typeof payload !== "object") {
    return null;
  }

  const candidate = payload as {
    version?: unknown;
    updatedAt?: unknown;
    profiles?: unknown;
  };

  if (candidate.version !== SUPPORTED_SCHEMA_VERSION) {
    console.warn(
      `[profiles-source] Unsupported schema version: ${String(candidate.version)}`,
    );
    return null;
  }

  if (typeof candidate.updatedAt !== "string") {
    return null;
  }

  if (!Array.isArray(candidate.profiles)) {
    return null;
  }

  if (candidate.profiles.length === 0) {
    return null;
  }

  const validated: Profile[] = [];
  for (const entry of candidate.profiles) {
    const normalized = validateEntry(entry);
    if (normalized === null) {
      console.warn("[profiles-source] Invalid profile entry rejected:", entry);
      return null;
    }
    validated.push(normalized);
  }

  return {
    version: candidate.version,
    updatedAt: candidate.updatedAt,
    profiles: validated,
  };
}

function validateEntry(entry: unknown): Profile | null {
  if (entry === null) {
    return null;
  }
  if (typeof entry !== "object") {
    return null;
  }

  const candidate = entry as Record<string, unknown>;

  if (
    typeof candidate.username !== "string" ||
    candidate.username.length === 0
  ) {
    return null;
  }
  if (typeof candidate.name !== "string" || candidate.name.length === 0) {
    return null;
  }
  if (candidate.side !== "left" && candidate.side !== "right") {
    return null;
  }
  if (typeof candidate.url !== "string" || candidate.url.length === 0) {
    return null;
  }

  return {
    username: candidate.username,
    name: candidate.name,
    side: candidate.side,
    url: candidate.url,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(STATE_STORE_NAME)) {
        db.createObjectStore(STATE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function safeReadCache(): Promise<CacheRecord | null> {
  try {
    const db = await openDatabase();
    const record = await new Promise<CacheRecord | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(CACHE_STORE_NAME, "readonly");
        const req = tx.objectStore(CACHE_STORE_NAME).get(CACHE_RECORD_KEY);
        req.onsuccess = () => resolve(req.result as CacheRecord | undefined);
        req.onerror = () => reject(req.error);
      },
    );
    db.close();

    if (record === undefined) {
      return null;
    }
    if (typeof record.fetchedAt !== "number") {
      return null;
    }
    if (typeof record.version !== "number") {
      return null;
    }
    if (!Array.isArray(record.profiles)) {
      return null;
    }
    return record;
  } catch (error) {
    console.warn("[profiles-source] Cache read failed:", error);
    return null;
  }
}

async function safeWriteCache(record: CacheRecord): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE_NAME, "readwrite");
      tx.objectStore(CACHE_STORE_NAME).put(record, CACHE_RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) {
    console.warn("[profiles-source] Cache write failed:", error);
  }
}
