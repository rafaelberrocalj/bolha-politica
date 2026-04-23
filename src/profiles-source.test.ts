import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROFILES } from "./config";
import {
  getProfiles,
  PROFILES_CACHE_TTL_MS,
  REMOTE_PROFILES_URL,
  SUPPORTED_SCHEMA_VERSION,
} from "./profiles-source";

const DB_NAME = "minha-bolha-politica";
const DB_VERSION = 2;
const STORE_NAME = "profiles-cache";
const RECORD_KEY = "profiles";

const MS_IN_MINUTE = 60_000;

type CacheRecord = {
  fetchedAt: number;
  version: number;
  updatedAt: string;
  profiles: Array<Record<string, unknown>>;
};

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains("extension-state")) {
        db.createObjectStore("extension-state");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeCache(record: CacheRecord): Promise<void> {
  const db = await openCacheDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record, RECORD_KEY);
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function readCache(): Promise<CacheRecord | undefined> {
  const db = await openCacheDb();
  const result = await new Promise<CacheRecord | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      req.onsuccess = () => resolve(req.result as CacheRecord | undefined);
      req.onerror = () => reject(req.error);
    },
  );
  db.close();
  return result;
}

function resetDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

const validRemotePayload = {
  version: 1,
  updatedAt: "2026-04-22",
  profiles: [
    { username: "alpha", name: "Alpha", side: "left" },
    { username: "bravo", name: "Bravo", side: "right" },
  ],
};

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

describe("getProfiles", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await resetDb();
  });

  it("returns cached profiles when cache is fresh (< 24h old)", async () => {
    const cachedProfiles = [
      { username: "cached-one", name: "Cached One", side: "left" },
      { username: "cached-two", name: "Cached Two", side: "right" },
    ];
    await writeCache({
      fetchedAt: Date.now() - (PROFILES_CACHE_TTL_MS - MS_IN_MINUTE),
      version: SUPPORTED_SCHEMA_VERSION,
      updatedAt: "2026-04-22",
      profiles: cachedProfiles,
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual(cachedProfiles);
  });

  it("fetches remote when cache is stale (> 24h old)", async () => {
    await writeCache({
      fetchedAt: Date.now() - (PROFILES_CACHE_TTL_MS + MS_IN_MINUTE),
      version: SUPPORTED_SCHEMA_VERSION,
      updatedAt: "2026-04-22",
      profiles: [{ username: "stale", name: "Stale", side: "left" }],
    });

    const fetchMock = mockFetchOk(validRemotePayload);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(REMOTE_PROFILES_URL);
    expect(result).toEqual(validRemotePayload.profiles);
  });

  it("fetches remote when cache is empty/missing", async () => {
    const fetchMock = mockFetchOk(validRemotePayload);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(REMOTE_PROFILES_URL);
    expect(result).toEqual(validRemotePayload.profiles);
  });

  it("falls back to bundled profiles when fetch fails (network error)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });

  it("falls back to bundled when remote returns non-2xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });

  it("falls back to bundled when remote JSON is malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });

  it("falls back to bundled when schema version is unknown (not 1)", async () => {
    const unknownSchema = {
      version: 99,
      updatedAt: "2026-04-22",
      profiles: [{ username: "x", name: "X", side: "left" }],
    };
    const fetchMock = mockFetchOk(unknownSchema);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });

  it("falls back to bundled when profiles array is empty", async () => {
    const emptyPayload = {
      version: 1,
      updatedAt: "2026-04-22",
      profiles: [],
    };
    const fetchMock = mockFetchOk(emptyPayload);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });

  it("writes successful fetches to cache (including version and updatedAt)", async () => {
    const fetchMock = mockFetchOk(validRemotePayload);
    vi.stubGlobal("fetch", fetchMock);

    const before = Date.now();
    const result = await getProfiles();
    const after = Date.now();

    expect(result).toEqual(validRemotePayload.profiles);

    const cached = await readCache();
    expect(cached).toBeDefined();
    expect(cached?.profiles).toEqual(validRemotePayload.profiles);
    expect(cached?.fetchedAt).toBeGreaterThanOrEqual(before);
    expect(cached?.fetchedAt).toBeLessThanOrEqual(after);
    expect(cached?.version).toBe(validRemotePayload.version);
    expect(cached?.updatedAt).toBe(validRemotePayload.updatedAt);
  });

  it("validates individual profile entries (rejects entries missing username/name/side)", async () => {
    const invalidPayload = {
      version: 1,
      updatedAt: "2026-04-22",
      profiles: [
        { username: "good", name: "Good", side: "left" },
        { username: "no-name", side: "right" },
      ],
    };
    const fetchMock = mockFetchOk(invalidPayload);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });

  it("falls back to bundled when a profile entry has invalid side value", async () => {
    const invalidSide = {
      version: 1,
      updatedAt: "2026-04-22",
      profiles: [{ username: "alpha", name: "Alpha", side: "center" }],
    };
    const fetchMock = mockFetchOk(invalidSide);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });

  it("treats cache as miss when cached version mismatches SUPPORTED_SCHEMA_VERSION", async () => {
    const cachedProfiles = [{ username: "old", name: "Old", side: "left" }];
    await writeCache({
      fetchedAt: Date.now() - (PROFILES_CACHE_TTL_MS - MS_IN_MINUTE), // fresh by age
      version: 99, // wrong version
      updatedAt: "2026-01-01",
      profiles: cachedProfiles,
    });

    const fetchMock = mockFetchOk(validRemotePayload);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(validRemotePayload.profiles);
  });

  it("falls back to bundled when fetch times out (AbortError)", async () => {
    const abortError = new DOMException("Timed out", "AbortError");
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", fetchMock);

    const result = await getProfiles();

    expect(result).toEqual(PROFILES);
  });
});
