# Phase 2 Backlog (carry-overs from Phase 1 final review)

**Source:** Final cross-cutting code review on 2026-04-25, after all 11 Phase 1 tasks complete and user-verified end-to-end against a real Pega Infinity instance.

These items did not block Phase 1 closure (DoD met) but should be addressed early in Phase 2.

## Important

### B-1: `INVALID_CONFIG` exits with code 1 instead of code 2

**Where:** `src/base-command.ts` `fail()` always calls `this.exit(1)`.

**Why it matters:** PRD section FR-ERR-2 (and `README.md` Exit codes table) specify exit `2` for invalid arguments or missing configuration. Currently `getConfig()` throws `{ code: 'INVALID_CONFIG' }` which propagates through `fail()` and exits `1`. Any CI/CD script using `$?` to distinguish config errors from API errors will see them merged.

**Fix:** In `BaseCommand.fail()`, detect `INVALID_CONFIG` (and possibly `INVALID_ARGS` from `readDataFlag`) and call `this.exit(2)` for those codes. Add a test that asserts the exit code, not just that the call rejects.

### B-2: nock `.delay()` + AbortController interaction prints `InterceptorError` to stderr

**Where:** `test/lib/api-client.test.ts` — the `timeout throws TIMEOUT` test.

**Why it matters:** The test passes deterministically, but nock v14's delayed reply fires after the abort and produces an unhandled `InterceptorError` printed to the Node process stderr. The error appears on every run and could mask real failures in CI logs.

**Fix:** Replace the timeout test with a pattern that doesn't rely on nock's `.delay()`. Stub `fetch` directly, or use `jest.useFakeTimers()` to control the AbortController without involving nock.

## Minor

### B-3: Document `chmod 0600 ~/.pega-cli/config.json` in README

The README's Configuration section shows the config file structure with `clientSecret` but does not advise restrictive permissions. A user following the README literally creates a world-readable file containing their OAuth secret.

**Fix:** One-line note in README under Configuration: "Set `chmod 0600 ~/.pega-cli/config.json` after creating it, since it contains credentials."

### B-4: Pre-redact `Authorization` in `LoggedRequest.headers`

**Where:** `src/lib/api-client.ts` `LoggedRequest` interface.

**Why it matters:** `onVerbose` callbacks receive the raw `Authorization: Bearer <token>` value. Phase 1's verbose handler only logs method+url, but Phase 2 may extend it. The first developer who logs headers will inadvertently leak tokens.

**Fix:** Pre-redact `Authorization` in `doRequest` before passing the headers to `onVerbose`, so the raw token never reaches the callback.

### B-5: Expose 45-second extended timeout for data view operations

**Where:** `src/lib/api-client.ts` — `DEFAULT_TIMEOUT_MS = 15_000`.

**Why it matters:** phase-1.md said "preserve the 45-second extended timeout for data view operations (relevant for Phase 2 but wire in now)." The override mechanism (`RequestOpts.timeoutMs`) is wired, but there's no `EXTENDED_TIMEOUT_MS` constant or named option for data view operations. Phase 2's `pega data` commands need it.

**Fix:** Add `export const EXTENDED_TIMEOUT_MS = 45_000;` and document the recommended override pattern for data view callers (or expose a separate `dataViewTimeout` option on `PegaApiClientDeps`).
