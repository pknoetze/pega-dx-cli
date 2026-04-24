# Pega DX CLI — Phase 1 Design

**Date:** 2026-04-24
**Status:** Approved — ready for implementation plan
**Source requirements:** [phase-1.md](../../../phase-1.md), [PRD.md](../../../PRD.md)

---

## 1. Overview

Build `@pknoetze/pega-dx-cli` — an oclif-based TypeScript CLI that wraps the Pega Infinity DX API V2 (Constellation). Phase 1 delivers the core infrastructure (API client, config/auth store, output formatter, global flags) plus 9 commands across three groups: `pega auth`, `pega cases`, `pega assignments`.

The CLI is explicitly designed as an alternative to the existing `pega-dx-mcp` MCP server; it targets LLM coding agents that pay a heavy token tax for MCP's 67 tool schemas. Same API client underneath — swap the MCP transport for a CLI transport.

## 2. Build approach

**Layered top-down with strict TDD.** Build the foundation modules before any commands; for each module, write failing tests first, then implementation. phase-1.md explicitly instructs this order, and strict TDD pairs naturally with well-bounded layers.

**Build order:** `errors` → `output` → `config` → `api-client` → `base-command` → 9 commands.

## 3. Toolchain

| Choice | Decision | Rationale |
|---|---|---|
| Language | TypeScript with `strict: true` + `noUncheckedIndexedAccess` | TDD relies on the compiler catching contract violations |
| Module system | ESM (`"type": "module"`) | Node 22+ default; oclif v4 supports natively |
| CLI framework | `@oclif/core` v4 | Native ESM+TS; phase-1.md mandates oclif |
| HTTP client | Native `fetch` (Node 22+) | Zero deps; phase-1.md says no raw HTTP errors leak — native works |
| HTTP mocking | `nock` | Standard Node mocking lib; intercepts at HTTP layer |
| Test runner | Jest with `ts-jest` | Phase-1.md mandates Jest; ts-jest handles ESM+TS |
| Filesystem mocking | `memfs` | For token cache tests without touching real `$HOME` |
| Package manager | `npm` | Matches phase-1.md examples |
| Lint/format | ESLint (flat config) + Prettier | Standard oclif project setup |
| Node target | 22+ LTS | Per phase-1.md and PRD section 7.1 |

## 4. File layout

```
pega-dx-cli/
├── bin/
│   └── run.js                    # oclif entry point (thin ESM shim)
├── src/
│   ├── base-command.ts           # BaseCommand with global flags + helpers
│   ├── lib/
│   │   ├── errors.ts             # NormalizedError type + mapping
│   │   ├── api-client.ts         # PegaApiClient (OAuth injected via TokenProvider)
│   │   ├── config.ts             # Config resolution + token cache + OAuth
│   │   └── output.ts             # stdout, stderr, error, dryRun
│   └── commands/
│       ├── auth/{login,ping,diagnose}.ts
│       ├── cases/{get,create,delete}.ts
│       └── assignments/{get,get-next,perform}.ts
├── test/
│   ├── lib/
│   │   ├── errors.test.ts
│   │   ├── api-client.test.ts
│   │   ├── config.test.ts
│   │   └── output.test.ts
│   ├── commands/
│   │   ├── auth/{login,ping,diagnose}.test.ts
│   │   ├── cases/{get,create,delete}.test.ts
│   │   └── assignments/{get,get-next,perform}.test.ts
│   └── helpers/
│       ├── capture-output.ts
│       ├── mock-filesystem.ts
│       └── mock-pega-api.ts
├── phase-1.md
├── PRD.md
├── README.md
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.ts
└── eslint.config.js
```

## 5. Module designs

### 5.1 `lib/errors.ts`

```typescript
export interface NormalizedError {
  code: string;         // "NOT_FOUND" | "UNAUTHORIZED" | "RATE_LIMITED" | "TIMEOUT" | "NETWORK_ERROR" | "INVALID_CONFIG" | ...
  message: string;
  httpStatus: number;   // 0 for non-HTTP errors
  pegaErrorId?: string; // Pega's ERR-NNNN when present in response body
}

export function fromHttpResponse(res: Response, body: unknown): NormalizedError;
export function fromNetworkError(err: Error): NormalizedError;
export function isNormalizedError(err: unknown): err is NormalizedError;
```

Single pure module. No IO. Consumed by both `api-client.ts` (API failures) and `config.ts` (OAuth failures).

### 5.2 `lib/api-client.ts`

**Public interface:**

```typescript
export interface PegaApiClient {
  get<T>(path: string, opts?: RequestOpts): Promise<T>;
  post<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  patch<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  delete<T>(path: string, opts?: RequestOpts): Promise<T>;
}

export interface RequestOpts {
  timeoutMs?: number;               // default 15000; 45000 for data view paths
  extraHeaders?: Record<string, string>;
}

export interface PegaApiClientDeps {
  baseUrl: string;
  tokenProvider: () => Promise<string>;   // provided by config layer
  onVerbose?: (req: LoggedRequest, res: LoggedResponse) => void;
}

export function createPegaApiClient(deps: PegaApiClientDeps): PegaApiClient;
```

**Responsibilities:**
- OAuth header injection via `tokenProvider()` before every request.
- Correct Pega DX API V2 headers (confirmed from MCP source).
- 45s extended timeout for data view operations (wired now for Phase 2 readiness).
- Convert all failures into `NormalizedError` — never throw raw fetch/HTTP errors.
- Optional `onVerbose` hook for `--verbose` logging — the client does not touch stderr directly.

**HTTP-to-code mapping:**
- 401 → `UNAUTHORIZED`
- 404 → `NOT_FOUND`
- 429 → `RATE_LIMITED`
- 408 / timeout / abort → `TIMEOUT`
- 5xx → `SERVER_ERROR`
- non-2xx with Pega error body → extract `pegaErrorId`
- Network / DNS error → `NETWORK_ERROR`

**Key seam:** the client receives tokens via a function, not by reading config directly. The config layer owns all cache/credential concerns.

### 5.3 `lib/config.ts`

**Public interface:**

```typescript
export interface PegaConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  profile: string;
}

export interface TokenResult {
  accessToken: string;
  expiresAt: string;         // ISO 8601
}

export function getConfig(profile?: string): PegaConfig;
export function getToken(opts: { noCache: boolean; profile: string; forceFresh?: boolean }): Promise<TokenResult>;
export function clearToken(profile: string): void;
```

**Config resolution order** (phase-1.md):
1. Environment variables (`PEGA_BASE_URL`, `PEGA_CLIENT_ID`, `PEGA_CLIENT_SECRET`) — highest precedence
2. `~/.pega-cli/config.json` — shape: `{ "profiles": { "<name>": { "baseUrl": ..., "clientId": ..., "clientSecret": ... } } }`

Missing required config → throw `NormalizedError { code: "INVALID_CONFIG" }`.

**Token cache (`~/.pega-cli/token.json`):**
- Per-profile structure: `{ "<profile>": { "accessToken": "...", "expiresAt": "<ISO>" } }`.
- File mode `0600` on Unix (`fs.writeFile` with `mode: 0o600`); skipped on Windows.
- Auto-refresh if less than 60s remain on the cached token.
- `forceFresh: true` — invalidate cached entry first, then acquire (used by `auth login`).

**`--no-cache` / `PEGA_NO_CACHE=true` behavior:**
- Do **not** read the token file.
- Do **not** write the token file.
- Always perform a fresh OAuth exchange; return the token in memory only.

**OAuth call lives in `config.ts`.** The config layer is the only module that knows credentials exist. Errors from the OAuth exchange are normalized via `errors.ts` before reaching any caller.

### 5.4 `lib/output.ts`

**Public interface:**

```typescript
export interface OutputOpts {
  format: 'json' | 'compact';
  fields?: string;
}

export function stdout(data: unknown, opts: OutputOpts): void;
export function stderr(message: string, opts: { quiet: boolean }): void;
export function error(err: NormalizedError): void;  // always emits; --quiet does NOT suppress
export function dryRun(req: { method: string; url: string; headers: Record<string, string>; body?: unknown }): void;
```

- `stdout`: applies `--fields` (top-level keys only), serializes per `--format` (`json` = 2-space indent; `compact` = minified).
- `error`: always emits (suppressing structured errors in CI would defeat the point). `--quiet` suppresses `stderr()` only.
- `dryRun`: redacts `headers.Authorization` → `"[REDACTED]"`, then prints a structured JSON request object to **stdout**. The caller then exits 0.

**Ambiguity resolved:** phase-1.md doesn't explicitly say whether `--quiet` suppresses structured errors. Conservative read: `error()` always emits; `stderr()` (progress/warnings) respects `--quiet`. Comment in code.

### 5.5 `base-command.ts`

```typescript
export abstract class BaseCommand extends Command {
  static baseFlags = {
    format: Flags.string({ options: ['json', 'compact'], default: 'json' }),
    fields: Flags.string(),
    'dry-run': Flags.boolean({ default: false }),
    quiet: Flags.boolean({ default: false }),
    verbose: Flags.boolean({ default: false }),
    'no-cache': Flags.boolean({ default: false }),
    profile: Flags.string({ default: 'default' }),
  };

  protected async getClient(flags: ParsedFlags): Promise<PegaApiClient>;
  protected emit(data: unknown, flags: ParsedFlags): void;
  protected emitDryRun(req: DryRunRequest): void;
  protected fail(err: NormalizedError): never;   // emits error + exits 1
}
```

- `baseFlags` inherits into every subclass via oclif v4's native mechanism.
- `getClient()` reads `--profile` + `--no-cache`, constructs a `TokenProvider` closure around `getToken()`, returns a configured `PegaApiClient`. If OAuth fails here, throws `NormalizedError`; the command's error boundary catches and calls `fail()`.
- Exit codes: `0` success; `2` oclif parse/validation errors (framework default); `1` everything else.

## 6. Command designs

All 9 commands follow the same skeleton:

```typescript
async run() {
  const { args, flags } = await this.parse(Self);
  const req = { method, url, headers, body? };
  if (flags['dry-run']) return this.emitDryRun(req);
  try {
    const client = await this.getClient(flags);
    const result = await client.<verb>(req.url, ...);
    this.emit(result, flags);
  } catch (err) {
    this.fail(err as NormalizedError);
  }
}
```

**Per-command details:**

| Command | Args / Flags | Output | Notes |
|---|---|---|---|
| `auth login` | (global only) | `{ authenticated: true, expiresAt }` | Calls `getToken({ forceFresh: true })` — login should always re-acquire, not lie about a cache hit. `--dry-run` prints OAuth token request with secret redacted. |
| `auth ping` | (global only) | `{ reachable: true, responseTimeMs }` or `{ reachable: false, error }` | Measures via `performance.now()`. Returns non-reachable as success (exit 0), not as error — the command completed its job of reporting status. |
| `auth diagnose` | (global only) | `{ checks: [...], overall: "pass"\|"fail" }` | Four sequential checks: baseUrl format, credential presence, OAuth exchange, API V2 reachability. Always exits 0 — diagnose reports failures, doesn't fail on them. |
| `cases get <caseId>` | positional | case JSON (filtered by `--fields`) | Maps to MCP `get_case`. |
| `cases create` | `--type <id>` required; `--data <json\|@file\|->` | created case JSON | Maps to MCP `create_case`. Shared `readDataFlag()` helper handles 3 input forms. |
| `cases delete <caseId>` | positional | `{ deleted: true, caseId }` | Maps to MCP `delete_case`. |
| `assignments get <assignmentId>` | positional | assignment JSON | Maps to MCP `get_assignment`. |
| `assignments get-next` | (none) | assignment JSON or `{ assignment: null }` | Empty queue is not an error; exit 0. |
| `assignments perform <assignmentId>` | positional; `--action <id>` required; `--data` optional | Pega result JSON | Maps to MCP `perform_assignment_action`. |

**Shared helper — `readDataFlag(value: string)`:**
- `{...}` → `JSON.parse(value)`
- `@path` → read file, then `JSON.parse`
- `-` → read stdin, then `JSON.parse`
- JSON parse failure → throw `NormalizedError { code: "INVALID_ARGS" }` → exit 2

## 7. Testing strategy

**Strict TDD** — for each module, every behavior starts as a failing test.

| Boundary | Tool | Reason |
|---|---|---|
| HTTP (Pega API + OAuth) | `nock` | Intercepts at Node HTTP layer; compatible with native fetch via undici |
| Filesystem (`~/.pega-cli/`) | `memfs` with dependency-injected `fs` | Verify `0600` mode + `--no-cache` bypass without touching real `$HOME` |
| `process.stdout` / `process.stderr` | Jest spies on `.write` | Assert exact bytes; verify stdout is pristine when only `dryRun` prints |
| `process.stdin` | Injected Readable stream | For `--data -` tests |
| Time (token expiry) | `jest.useFakeTimers()` | Deterministic test of "<60s remaining → refresh" |
| oclif command invocation | `Command.run([...argv])` | Built-in entry point; captures thrown errors + exit codes |

**Out of scope for tests:**
- Real network, real filesystem — ever.
- oclif internals — trust the framework.
- Upstream Pega API behavior — test that *we send the right request and handle documented responses*, not that Pega returns what its docs say.

**TDD example — first 3 tests for `api-client.ts`:**
1. `get() injects Authorization: Bearer <token>` — forces the `TokenProvider` seam to exist.
2. `get() returns parsed JSON on 200` — forces happy path.
3. `get() throws NormalizedError { code: "NOT_FOUND" } on 404` — forces error boundary.

**Exit criteria:** every module has happy path + at least one error branch covered; every command has dry-run + success + error tests; `npm test` passes.

## 8. Architectural constraints (from phase-1.md, codified)

- **stdout is sacred.** Only command output goes to stdout; logs/warnings/errors go to stderr.
- **Exit codes:** `0` success, `1` API/runtime error, `2` invalid args/config. Nothing else.
- **`--dry-run` on every command** — prints redacted request and exits 0 before any network call.
- **Credentials never in flags.** Env vars or config file only.
- **API client never throws raw HTTP errors** — every failure is a `NormalizedError`.
- **`--no-cache` wired from day one** — both the flag and `PEGA_NO_CACHE` env var.
- **V2 only.** No V1 code paths.

## 9. Deliverables for Phase 1 completion

Per phase-1.md's Definition of Done:

- [ ] `npm install -g .` produces a working `pega` binary.
- [ ] `pega --help` lists all command groups.
- [ ] `pega <group> --help` lists subcommands; every command's `--help` shows description, flags, and at least one example.
- [ ] `pega auth diagnose` correctly identifies valid and invalid configs.
- [ ] `pega cases get <id> --dry-run` prints HTTP request with redacted auth header and exits 0.
- [ ] `pega cases create --type X --data @file.json` works end-to-end against a real Pega instance.
- [ ] `pega assignments perform <id> --action Y` works end-to-end.
- [ ] `PEGA_NO_CACHE=true pega auth login` does not read or write `~/.pega-cli/token.json`.
- [ ] `npm test` passes with zero failures.
- [ ] `README.md` complete: installation, configuration, quick start, command reference, global flags reference, CI/CD usage, troubleshooting.

## 10. Open items (deferred to Phase 2, do not implement now)

- `--format yaml`, `--format table`
- Remaining `pega cases` verbs (action, stage, etc.)
- Remaining `pega assignments` verbs
- Other command groups: `case-types`, `attachments`, `data`, `documents`, `followers`, `participants`, `related`, `tags`
- `--interactive` wizard mode
- Full multi-profile config UX (profile management commands)
- Binary distribution via esbuild + pkg/nexe (Phase 3)

---

## Implementation notes (for the plan that follows)

- MCP source repo to fetch during implementation: `https://github.com/marco-looy/pega-dx-mcp` — specifically `PegaAPIClient`, OAuth logic, error normalization patterns, and the ping/diagnose/case/assignment tool implementations.
- Do not copy MCP protocol code (transport, tool registration, schema definitions) — only the API client and business logic.
- When MCP source and phase-1.md disagree, phase-1.md wins.
- When phase-1.md is silent on something genuinely ambiguous, implement the more conservative option and leave a `// TODO: confirm with PRD owner` comment.
