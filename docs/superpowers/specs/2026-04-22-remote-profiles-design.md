# Remote Profiles Configuration — Design Spec

**Date:** 2026-04-22
**Status:** Draft — pending user review
**Author:** Marcos Paulo (via Claude brainstorming)

## Goal

Decouple the profile list (Brazilian political figures analyzed by the extension) from the extension release cycle.

Today, adding a profile requires a code change to `src/config.ts`, a new npm version bump, a Chrome Web Store submission, and the store review cycle (days to weeks) before users see the change. By moving the profile list to a remote JSON file hosted in the same repo, a merged PR propagates to all users within 24 hours with no extension release needed.

## Non-Goals

The following are explicitly **out of scope** for this spec:

- History tracking across runs
- Expansion to other platforms (Twitter/X, YouTube, Facebook)
- Political spectrum expansion beyond binary `left` / `right`
- User-configurable profiles in the extension UI
- Backfilling unit tests for pre-existing untested code (only newly added code is tested)

## Architecture

```
GitHub repo
  └── data/profiles.json (committed to main)
        ↓ raw.githubusercontent.com
background.ts (on analysis start)
        ↓
IndexedDB profiles-cache store
  ├── fresh (< 24h) → use cached list
  ├── stale / missing → fetch remote
  │     ├── success → update cache, use fetched list
  │     └── failure → fall back to bundled config.ts profiles
  └── corrupt / invalid schema → discard, fetch, else bundled
```

**Key properties:**

- Works offline (bundled fallback always present)
- Fast after first run (24h TTL keeps most runs off the network)
- Schema-versioned (old clients ignore unknown versions safely)
- No extension release required to add/remove profiles

## Data Model

### Remote JSON schema — `data/profiles.json`

```json
{
  "version": 1,
  "updatedAt": "2026-04-22",
  "profiles": [
    {
      "username": "lulaoficial",
      "name": "Lula",
      "side": "left"
    },
    {
      "username": "jairmessiasbolsonaro",
      "name": "Bolsonaro",
      "side": "right"
    }
  ]
}
```

**Fields:**

| Field | Type | Purpose |
|---|---|---|
| `version` | `number` | Schema version. Client ignores unknown versions and falls back to bundled. |
| `updatedAt` | `string` (ISO date) | Last edit date. Transparency / debugging aid. |
| `profiles[].username` | `string` | Instagram handle used for API call. |
| `profiles[].name` | `string` | Display name shown in UI. |
| `profiles[].side` | `"left" \| "right"` | Political classification. |

### IndexedDB cache schema

New object store `profiles-cache` in the existing `minha-bolha-politica` database (version bump to `2`).

**Stored record (key = `"profiles"`):**

```typescript
type ProfilesCacheEntry = {
  fetchedAt: number;       // Unix ms timestamp
  version: number;         // Schema version from remote JSON
  updatedAt: string;       // From remote JSON
  profiles: Profile[];     // Same Profile type as config.ts
};
```

**TTL:** 24 hours (`24 * 60 * 60 * 1000` ms). Extracted to named constant `PROFILES_CACHE_TTL_MS`.

### Constants

```typescript
const REMOTE_PROFILES_URL =
  "https://raw.githubusercontent.com/rafaelberrocalj/bolha-politica/main/data/profiles.json";
const SUPPORTED_SCHEMA_VERSION = 1;
const PROFILES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
```

## Component Changes

### New files

| File | Purpose |
|---|---|
| `data/profiles.json` | Remote-served profile list (same content as current `config.ts`). |
| `src/profiles-source.ts` | Single entry point: `getProfiles(): Promise<Profile[]>`. Encapsulates fetch + cache + fallback logic. |
| `src/profiles-source.test.ts` | Unit tests for `getProfiles()` covering all 4 error paths. |
| `vitest.config.ts` | Test runner config. |
| `docs/superpowers/specs/2026-04-22-remote-profiles-design.md` | This spec. |

### Modified files

| File | Change |
|---|---|
| `src/background.ts` | Replace direct import of `PROFILES` from `config.ts` with `await getProfiles()` call. |
| `src/config.ts` | Keep `PROFILES` constant as the **bundled fallback**. No structural change. |
| `tsconfig.json` | Add `"types": ["chrome"]` to fix `tsc --noEmit` errors (pre-existing issue). |
| `package.json` | Add `typecheck` and `test` scripts; add `vitest` to devDependencies. Update `build` to run `typecheck` before `lint`. |
| `manifest.json` | Add `https://raw.githubusercontent.com/*` to `host_permissions` so the fetch is allowed by MV3. |

### `profiles-source.ts` API

```typescript
export async function getProfiles(): Promise<Profile[]>;
```

**Behavior (in order):**

1. Read cache from `profiles-cache` store.
2. If cache entry exists and `Date.now() - fetchedAt < PROFILES_CACHE_TTL_MS` and `version === SUPPORTED_SCHEMA_VERSION`, return `cache.profiles`.
3. Otherwise, attempt `fetch(REMOTE_PROFILES_URL)`:
   - On HTTP success with valid JSON matching schema: write to cache, return fetched profiles.
   - On any failure (network, parse, schema invalid, unknown version, empty profiles array): return bundled `PROFILES` from `config.ts`.
4. All error paths log a warning via `console.warn` with the failure reason.

**Validation rules:**

- `version` must equal `SUPPORTED_SCHEMA_VERSION` (currently `1`).
- `profiles` must be a non-empty array.
- Each profile must have non-empty `username`, `name`, and `side` in `{"left", "right"}`.

## Error Handling

| Failure mode | Behavior |
|---|---|
| Remote fetch network error | Return cached if available; else bundled. Log warning. |
| Remote returns non-2xx | Return cached if available; else bundled. Log warning. |
| Remote returns invalid JSON | Return cached if available; else bundled. Log warning. |
| Remote returns unknown schema `version` | Return bundled (do not use cache either — safer). Log warning. |
| Remote returns empty `profiles` array | Return bundled. Log warning. |
| IndexedDB read fails | Skip cache, attempt fetch, fall back to bundled. Log warning. |
| IndexedDB write fails | Use fetched result anyway. Log warning. |

No error path throws. `getProfiles()` always resolves with a valid `Profile[]`.

## Testing Strategy

**Test runner:** Vitest (fast, TS-native, zero-config).

**Unit tests (`profiles-source.test.ts`):**

- ✅ Returns cached profiles when cache is fresh
- ✅ Fetches remote when cache is stale (> 24h old)
- ✅ Fetches remote when cache is empty
- ✅ Falls back to bundled profiles when fetch fails (network error)
- ✅ Falls back to bundled when remote returns non-2xx
- ✅ Falls back to bundled when remote JSON is malformed
- ✅ Falls back to bundled when schema version is unknown
- ✅ Falls back to bundled when `profiles` array is empty
- ✅ Writes successful fetches to cache
- ✅ Validates individual profile entries (rejects missing fields)

**Mocking:**

- `fetch` mocked via `vi.stubGlobal`.
- IndexedDB mocked via `fake-indexeddb`.

**No E2E tests** — out of scope; this is a pure logic module.

## Infra Fixes (Pre-Existing Issues)

These are tangential to the feature but blocked by it (we want `tsc` green before adding new TS code):

1. **`tsc --noEmit` fails with 29 errors** — chrome namespace missing. Fix: add `"types": ["chrome"]` to `tsconfig.json`.
2. **`npm test` is a placeholder** — replace with Vitest invocation.
3. **No `typecheck` script** — add `"typecheck": "tsc --noEmit"`. Wire into `build`.

## Rollout

1. Create the feature branch from `main`.
2. Land `data/profiles.json` **first** (a PR with just the data file — so the raw URL exists before the extension ever tries to fetch it).
3. Land the extension changes in a second PR.
4. Ship extension release that activates the remote fetch.
5. Future profile additions: single PR to `data/profiles.json` — no release.

## Open Questions

None at spec-writing time. User has approved:
- Remote JSON approach (vs. PR-only to `config.ts`)
- Binary left/right classification retained
- Cache-with-TTL + bundled fallback (Approach B)
- Same-repo hosting for the JSON
- Infra fixes included in scope
