# Pega DX CLI — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@pknoetze/pega-dx-cli` Phase 1 — a TypeScript oclif CLI with 9 commands (`auth login/ping/diagnose`, `cases get/create/delete`, `assignments get/get-next/perform`) backed by a ported Pega DX API V2 client, per the approved design at [docs/superpowers/specs/2026-04-24-pega-dx-cli-phase-1-design.md](../specs/2026-04-24-pega-dx-cli-phase-1-design.md).

**Architecture:** Layered top-down build (errors → output → config → api-client → base-command → commands). Strict TDD — red → green → refactor per unit. Standard headers and URLs ported verbatim from the MCP reference (`https://github.com/marco-looy/pega-dx-mcp`). Config owns OAuth + token cache; api-client receives tokens via an injected `TokenProvider` function.

**Tech Stack:** Node 22+, TypeScript 5.x with `strict: true`, ESM, `@oclif/core` v4, native `fetch`, Jest + `ts-jest`, `nock` for HTTP mocking, `memfs` for filesystem mocking.

**User Verification:** YES — Phase 1's Definition of Done explicitly requires end-to-end validation against a real Pega Infinity instance (`pega cases create --type X --data @file.json`, `pega assignments perform <id> --action Y`). Task 10 is a dedicated user verification checkpoint.

---

## Ground truth from MCP source (pinned during planning)

These facts come from `https://github.com/marco-looy/pega-dx-mcp` and anchor the port. Do not re-derive them.

**URLs (all derived from `baseUrl`):**
- OAuth token: `{baseUrl}/prweb/PRRestService/oauth2/v1/token`
- V2 API root: `{baseUrl}/prweb/api/application/v2`
- If `baseUrl` contains `/prweb`, strip it — the MCP does this with `replace(/\/prweb.*$/, '')`.

**OAuth request shape:**
- Method: `POST`
- Headers: `Content-Type: application/x-www-form-urlencoded`, `Authorization: Basic <base64(clientId:clientSecret)>`
- Body: `grant_type=client_credentials`
- Response: `{ access_token: string, expires_in?: number }` — default to 3600s if absent.

**Standard request headers on every API call:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Accept: application/json`
- `x-origin-channel: Web`

**V2 endpoints needed (all 9 commands):**
| Command | Method | Path |
|---|---|---|
| `cases get <id>` | GET | `/cases/{encodeURIComponent(id)}` |
| `cases create` | POST | `/cases` with body `{ caseTypeID, content?, pageInstructions?, attachments? }` |
| `cases delete <id>` | DELETE | `/cases/{encodeURIComponent(id)}` |
| `assignments get <id>` | GET | `/assignments/{encodeURIComponent(id)}` |
| `assignments get-next` | GET | `/assignments/next` |
| `assignments perform <id> --action X` | PATCH | `/assignments/{id}/actions/{action}` with `If-Match: <eTag>` header |

**eTag for `assignments perform`:** Pega requires `If-Match: <eTag>` on the PATCH. The MCP takes eTag as a parameter. Phase-1.md doesn't mention eTag; we resolve this by having `assignments perform` do a preliminary `GET /assignments/{id}` to obtain the eTag (from the `ETag` response header), then PATCH with it. This keeps the command signature simple per phase-1.md.

**Error mapping (http status → `NormalizedError.code`):**
| Status | code | Notes |
|---|---|---|
| 400 | `BAD_REQUEST` | |
| 401 | `UNAUTHORIZED` | Also clear token cache on this response |
| 403 | `FORBIDDEN` | |
| 404 | `NOT_FOUND` | |
| 408 / AbortError | `TIMEOUT` | Phase-1.md requirement |
| 409 | `CONFLICT` | |
| 412 | `PRECONDITION_FAILED` | |
| 422 | `VALIDATION_FAIL` | |
| 423 | `LOCKED` | |
| 424 | `FAILED_DEPENDENCY` | |
| 429 | `RATE_LIMITED` | Phase-1.md requirement |
| 500 | `INTERNAL_SERVER_ERROR` | |
| 5xx other | `SERVER_ERROR` | |
| (no response) | `NETWORK_ERROR` | DNS, socket, etc. |
| other | `HTTP_ERROR` | Fallback |

**Pega error response body shape** (used to extract `pegaErrorId`):
```json
{ "localizedValue": "...", "errorDetails": [{"erroneousInputOutputFieldInPage": "...", "message": "..."}], "errors": [{"ID": "ERR-0001", "message": "..."}] }
```
- `pegaErrorId` = `body.errors?.[0]?.ID` when present.
- Error message falls back to `body.localizedValue` → `body.errors?.[0]?.message` → HTTP statusText.

---

## Task 0: Project scaffolding

**Goal:** Produce an empty-but-working oclif + TypeScript + ESM project where `pega --help` executes and `npm test` runs (with zero tests).

**Files:**
- Create: `package.json`, `tsconfig.json`, `jest.config.ts`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `.env.example`, `bin/run.js`, `src/commands/.gitkeep`

**Acceptance Criteria:**
- [ ] `npm install` completes.
- [ ] `npm run build` emits ESM output to `dist/`.
- [ ] `./bin/run.js --help` prints the oclif help banner.
- [ ] `npm test` exits 0 (no tests yet; config must be valid).
- [ ] `npm run lint` exits 0.

**Verify:** `npm install && npm run build && ./bin/run.js --help && npm test && npm run lint` → all exit 0

**Steps:**

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@pknoetze/pega-dx-cli",
  "version": "0.1.0",
  "description": "CLI for Pega Infinity DX API V2 (Constellation)",
  "type": "module",
  "bin": {
    "pega": "./bin/run.js"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "engines": {
    "node": ">=22"
  },
  "files": [
    "bin",
    "dist",
    "oclif.manifest.json"
  ],
  "scripts": {
    "build": "tsc --build",
    "clean": "rimraf dist",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "prepack": "npm run clean && npm run build && oclif manifest"
  },
  "oclif": {
    "bin": "pega",
    "dirname": "pega",
    "commands": "./dist/commands",
    "topicSeparator": " ",
    "topics": {
      "auth": { "description": "Authentication and connectivity" },
      "cases": { "description": "Pega case operations (V2)" },
      "assignments": { "description": "Pega assignment operations (V2)" }
    }
  },
  "dependencies": {
    "@oclif/core": "^4.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^22.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "jest": "^29.7.0",
    "memfs": "^4.12.0",
    "nock": "^13.5.0",
    "oclif": "^4.0.0",
    "prettier": "^3.3.0",
    "rimraf": "^6.0.1",
    "ts-jest": "^29.2.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 3: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { module: 'ES2022' } }],
  },
  clearMocks: true,
  setupFilesAfterEach: [],
};

export default config;
```

- [ ] **Step 4: Create `eslint.config.js`**

```javascript
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { ignores: ['dist/', 'node_modules/', 'bin/', '*.config.js', '*.config.ts'] },
];
```

- [ ] **Step 5: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
oclif.manifest.json
.env
.DS_Store
coverage/
*.log
```

- [ ] **Step 7: Create `.env.example`**

```bash
# Required
PEGA_BASE_URL=https://your-instance.pega.com
PEGA_CLIENT_ID=your-client-id
PEGA_CLIENT_SECRET=your-client-secret

# Optional
PEGA_NO_CACHE=false        # Set to true in CI/CD environments
```

- [ ] **Step 8: Create `bin/run.js` (oclif entry point)**

```javascript
#!/usr/bin/env node
import { execute } from '@oclif/core';
await execute({ dir: import.meta.url });
```

Then make it executable: `chmod +x bin/run.js`

- [ ] **Step 9: Create empty `src/commands/.gitkeep`**

```
(empty file — oclif needs the directory to exist)
```

- [ ] **Step 10: Install dependencies and verify**

Run:
```bash
npm install
npm run build
chmod +x bin/run.js
./bin/run.js --help
npm test
npm run lint
```

Expected `--help` output contains `USAGE`, `TOPICS` section listing `auth`, `cases`, `assignments`.
Expected `npm test`: `No tests found` but exit code 0 (Jest returns 1 on no tests by default — use `--passWithNoTests`). Update test script:

```json
"test": "NODE_OPTIONS=--experimental-vm-modules jest --passWithNoTests"
```

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.json jest.config.ts eslint.config.js .prettierrc .gitignore .env.example bin/run.js src/commands/.gitkeep
git commit -m "Scaffold oclif + TypeScript + ESM project"
```

---

## Task 1: `lib/errors.ts` — NormalizedError + mapping

**Goal:** Pure error-normalization module. Consumed by both `config.ts` (OAuth failures) and `api-client.ts` (API failures). No IO, no external deps.

**Files:**
- Create: `src/lib/errors.ts`
- Test: `test/lib/errors.test.ts`

**Acceptance Criteria:**
- [ ] `NormalizedError` type matches design spec (code, message, httpStatus, pegaErrorId?).
- [ ] `fromHttpResponse(response, body)` maps each documented status code to the correct `code`.
- [ ] `fromNetworkError(err)` returns `{ code: "NETWORK_ERROR", httpStatus: 0, ... }`.
- [ ] `isNormalizedError(x)` type guard returns true only for valid NormalizedError objects.
- [ ] `pegaErrorId` extracted from `body.errors[0].ID` when present.
- [ ] Message resolution order: `body.localizedValue` → `body.errors[0].message` → `response.statusText`.

**Verify:** `npm test -- test/lib/errors.test.ts` → all green

**Steps:**

- [ ] **Step 1: Write the failing tests**

Create `test/lib/errors.test.ts`:

```typescript
import { describe, test, expect } from '@jest/globals';
import { fromHttpResponse, fromNetworkError, isNormalizedError } from '../../src/lib/errors.js';

function mockResponse(status: number, statusText = ''): Response {
  return new Response(null, { status, statusText });
}

describe('fromHttpResponse', () => {
  test('maps 400 → BAD_REQUEST', () => {
    const err = fromHttpResponse(mockResponse(400), { localizedValue: 'bad stuff' });
    expect(err).toEqual({
      code: 'BAD_REQUEST',
      message: 'bad stuff',
      httpStatus: 400,
    });
  });

  test('maps 401 → UNAUTHORIZED with fallback message from errors[0]', () => {
    const err = fromHttpResponse(mockResponse(401, 'Unauthorized'), {
      errors: [{ message: 'token expired' }],
    });
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('token expired');
  });

  test('maps 404 → NOT_FOUND', () => {
    const err = fromHttpResponse(mockResponse(404), { localizedValue: 'case not found' });
    expect(err.code).toBe('NOT_FOUND');
    expect(err.httpStatus).toBe(404);
  });

  test('maps 408 → TIMEOUT', () => {
    const err = fromHttpResponse(mockResponse(408), {});
    expect(err.code).toBe('TIMEOUT');
  });

  test('maps 409 → CONFLICT', () => {
    expect(fromHttpResponse(mockResponse(409), {}).code).toBe('CONFLICT');
  });

  test('maps 412 → PRECONDITION_FAILED', () => {
    expect(fromHttpResponse(mockResponse(412), {}).code).toBe('PRECONDITION_FAILED');
  });

  test('maps 422 → VALIDATION_FAIL', () => {
    expect(fromHttpResponse(mockResponse(422), {}).code).toBe('VALIDATION_FAIL');
  });

  test('maps 423 → LOCKED', () => {
    expect(fromHttpResponse(mockResponse(423), {}).code).toBe('LOCKED');
  });

  test('maps 424 → FAILED_DEPENDENCY', () => {
    expect(fromHttpResponse(mockResponse(424), {}).code).toBe('FAILED_DEPENDENCY');
  });

  test('maps 429 → RATE_LIMITED', () => {
    expect(fromHttpResponse(mockResponse(429), {}).code).toBe('RATE_LIMITED');
  });

  test('maps 500 → INTERNAL_SERVER_ERROR', () => {
    expect(fromHttpResponse(mockResponse(500), {}).code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('maps 502 → SERVER_ERROR (generic 5xx)', () => {
    expect(fromHttpResponse(mockResponse(502), {}).code).toBe('SERVER_ERROR');
  });

  test('falls back to HTTP_ERROR for unmapped status', () => {
    expect(fromHttpResponse(mockResponse(418, "I'm a teapot"), {}).code).toBe('HTTP_ERROR');
  });

  test('extracts pegaErrorId from body.errors[0].ID', () => {
    const err = fromHttpResponse(mockResponse(404), {
      errors: [{ ID: 'ERR-0001', message: 'bad' }],
      localizedValue: 'Case not found',
    });
    expect(err.pegaErrorId).toBe('ERR-0001');
  });

  test('falls back message to statusText when body empty', () => {
    const err = fromHttpResponse(mockResponse(503, 'Service Unavailable'), {});
    expect(err.message).toBe('Service Unavailable');
  });
});

describe('fromNetworkError', () => {
  test('maps TypeError from fetch → NETWORK_ERROR', () => {
    const err = fromNetworkError(new TypeError('fetch failed'));
    expect(err).toEqual({
      code: 'NETWORK_ERROR',
      message: 'fetch failed',
      httpStatus: 0,
    });
  });

  test('maps AbortError → TIMEOUT', () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    const err = fromNetworkError(abort);
    expect(err.code).toBe('TIMEOUT');
  });
});

describe('isNormalizedError', () => {
  test('true for valid NormalizedError', () => {
    expect(isNormalizedError({ code: 'X', message: 'y', httpStatus: 1 })).toBe(true);
  });

  test('false for random objects', () => {
    expect(isNormalizedError({})).toBe(false);
    expect(isNormalizedError(null)).toBe(false);
    expect(isNormalizedError('error')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/lib/errors.test.ts`
Expected: `Cannot find module '../../src/lib/errors.js'`

- [ ] **Step 3: Implement `src/lib/errors.ts`**

```typescript
export interface NormalizedError {
  code: string;
  message: string;
  httpStatus: number;
  pegaErrorId?: string;
}

interface PegaErrorBody {
  localizedValue?: string;
  errorDetails?: unknown;
  errors?: Array<{ ID?: string; message?: string }>;
  message?: string;
}

const STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'TIMEOUT',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  422: 'VALIDATION_FAIL',
  423: 'LOCKED',
  424: 'FAILED_DEPENDENCY',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER_ERROR',
};

function mapStatus(status: number): string {
  if (STATUS_TO_CODE[status]) return STATUS_TO_CODE[status];
  if (status >= 500 && status < 600) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
}

function resolveMessage(body: PegaErrorBody, response: Response): string {
  if (body.localizedValue) return body.localizedValue;
  if (body.errors?.[0]?.message) return body.errors[0].message;
  if (body.message) return body.message;
  return response.statusText || `HTTP ${response.status}`;
}

export function fromHttpResponse(response: Response, body: unknown): NormalizedError {
  const pegaBody = (body && typeof body === 'object' ? body : {}) as PegaErrorBody;
  const err: NormalizedError = {
    code: mapStatus(response.status),
    message: resolveMessage(pegaBody, response),
    httpStatus: response.status,
  };
  const pegaErrorId = pegaBody.errors?.[0]?.ID;
  if (pegaErrorId) err.pegaErrorId = pegaErrorId;
  return err;
}

export function fromNetworkError(err: Error): NormalizedError {
  if (err.name === 'AbortError') {
    return { code: 'TIMEOUT', message: err.message || 'Request timed out', httpStatus: 0 };
  }
  return { code: 'NETWORK_ERROR', message: err.message || 'Network error', httpStatus: 0 };
}

export function isNormalizedError(x: unknown): x is NormalizedError {
  if (!x || typeof x !== 'object') return false;
  const e = x as Partial<NormalizedError>;
  return typeof e.code === 'string' && typeof e.message === 'string' && typeof e.httpStatus === 'number';
}
```

- [ ] **Step 4: Run tests — expect all green**

Run: `npm test -- test/lib/errors.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/errors.ts test/lib/errors.test.ts
git commit -m "Add NormalizedError type and HTTP/network error mapping"
```

---

## Task 2: `lib/output.ts` — stdout / stderr / error / dryRun

**Goal:** Centralized output helpers. Enforces the "stdout is sacred" rule.

**Files:**
- Create: `src/lib/output.ts`
- Create: `test/helpers/capture-output.ts`
- Test: `test/lib/output.test.ts`

**Acceptance Criteria:**
- [ ] `stdout(data, { format: 'json' })` writes 2-space-indented JSON + newline to stdout.
- [ ] `stdout(data, { format: 'compact' })` writes minified JSON + newline to stdout.
- [ ] `stdout(data, { format, fields: 'a,b' })` filters data to only those top-level keys.
- [ ] `stderr(msg, { quiet: true })` writes nothing; `{ quiet: false }` writes msg + newline.
- [ ] `error(normalizedErr)` ALWAYS writes structured JSON to stderr, regardless of quiet.
- [ ] `dryRun({ method, url, headers, body })` redacts `headers.Authorization` → `"[REDACTED]"` and writes JSON to stdout.

**Verify:** `npm test -- test/lib/output.test.ts` → all green

**Steps:**

- [ ] **Step 1: Create `test/helpers/capture-output.ts`**

```typescript
export interface CapturedOutput {
  stdout: string[];
  stderr: string[];
  restore: () => void;
}

export function captureOutput(): CapturedOutput {
  const stdoutWrites: string[] = [];
  const stderrWrites: string[] = [];
  const origStdout = process.stdout.write.bind(process.stdout);
  const origStderr = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdoutWrites.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrWrites.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  }) as typeof process.stderr.write;

  return {
    stdout: stdoutWrites,
    stderr: stderrWrites,
    restore() {
      process.stdout.write = origStdout;
      process.stderr.write = origStderr;
    },
  };
}
```

- [ ] **Step 2: Write failing tests**

Create `test/lib/output.test.ts`:

```typescript
import { describe, test, expect, afterEach } from '@jest/globals';
import { stdout, stderr, error, dryRun } from '../../src/lib/output.js';
import { captureOutput, type CapturedOutput } from '../helpers/capture-output.js';

let captured: CapturedOutput;
afterEach(() => captured?.restore());

describe('stdout', () => {
  test('writes pretty JSON + newline by default', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2 }, { format: 'json' });
    expect(captured.stdout.join('')).toBe('{\n  "a": 1,\n  "b": 2\n}\n');
    expect(captured.stderr.join('')).toBe('');
  });

  test('writes minified JSON + newline when format=compact', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2 }, { format: 'compact' });
    expect(captured.stdout.join('')).toBe('{"a":1,"b":2}\n');
  });

  test('filters to only listed fields when fields is provided', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2, c: 3 }, { format: 'compact', fields: 'a,c' });
    expect(captured.stdout.join('')).toBe('{"a":1,"c":3}\n');
  });

  test('fields filter trims whitespace', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2 }, { format: 'compact', fields: ' a , b ' });
    expect(captured.stdout.join('')).toBe('{"a":1,"b":2}\n');
  });
});

describe('stderr', () => {
  test('writes message + newline when quiet is false', () => {
    captured = captureOutput();
    stderr('hello', { quiet: false });
    expect(captured.stderr.join('')).toBe('hello\n');
    expect(captured.stdout.join('')).toBe('');
  });

  test('writes nothing when quiet is true', () => {
    captured = captureOutput();
    stderr('hello', { quiet: true });
    expect(captured.stderr.join('')).toBe('');
  });
});

describe('error', () => {
  test('always writes structured JSON to stderr', () => {
    captured = captureOutput();
    error({ code: 'NOT_FOUND', message: 'gone', httpStatus: 404 });
    const parsed = JSON.parse(captured.stderr.join(''));
    expect(parsed).toEqual({
      error: true,
      code: 'NOT_FOUND',
      message: 'gone',
      httpStatus: 404,
    });
    expect(captured.stdout.join('')).toBe('');
  });

  test('includes pegaErrorId when present', () => {
    captured = captureOutput();
    error({ code: 'NOT_FOUND', message: 'gone', httpStatus: 404, pegaErrorId: 'ERR-1' });
    const parsed = JSON.parse(captured.stderr.join(''));
    expect(parsed.pegaErrorId).toBe('ERR-1');
  });
});

describe('dryRun', () => {
  test('redacts Authorization header and writes to stdout', () => {
    captured = captureOutput();
    dryRun({
      method: 'GET',
      url: 'https://x.pega.com/cases/C-1',
      headers: { Authorization: 'Bearer secret', 'x-origin-channel': 'Web' },
    });
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed.headers.Authorization).toBe('[REDACTED]');
    expect(parsed.headers['x-origin-channel']).toBe('Web');
  });

  test('preserves body when present', () => {
    captured = captureOutput();
    dryRun({
      method: 'POST',
      url: 'https://x.pega.com/cases',
      headers: { Authorization: 'Bearer x' },
      body: { caseTypeID: 'Claim' },
    });
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed.body).toEqual({ caseTypeID: 'Claim' });
  });

  test('handles case-insensitive Authorization header', () => {
    captured = captureOutput();
    dryRun({
      method: 'GET',
      url: 'https://x',
      headers: { authorization: 'Bearer x', AUTHORIZATION: 'Bearer y' },
    });
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed.headers.authorization).toBe('[REDACTED]');
    expect(parsed.headers.AUTHORIZATION).toBe('[REDACTED]');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- test/lib/output.test.ts`
Expected: `Cannot find module '../../src/lib/output.js'`

- [ ] **Step 4: Implement `src/lib/output.ts`**

```typescript
import type { NormalizedError } from './errors.js';

export interface OutputOpts {
  format: 'json' | 'compact';
  fields?: string;
}

export interface DryRunRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

function filterFields(data: unknown, fields: string): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const allowed = new Set(fields.split(',').map((f) => f.trim()).filter(Boolean));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}

function serialize(data: unknown, format: 'json' | 'compact'): string {
  return format === 'compact' ? JSON.stringify(data) : JSON.stringify(data, null, 2);
}

export function stdout(data: unknown, opts: OutputOpts): void {
  const filtered = opts.fields ? filterFields(data, opts.fields) : data;
  process.stdout.write(serialize(filtered, opts.format) + '\n');
}

export function stderr(message: string, opts: { quiet: boolean }): void {
  if (opts.quiet) return;
  process.stderr.write(message + '\n');
}

export function error(err: NormalizedError): void {
  const payload: Record<string, unknown> = {
    error: true,
    code: err.code,
    message: err.message,
    httpStatus: err.httpStatus,
  };
  if (err.pegaErrorId) payload.pegaErrorId = err.pegaErrorId;
  process.stderr.write(JSON.stringify(payload, null, 2) + '\n');
}

export function dryRun(req: DryRunRequest): void {
  const redactedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    redactedHeaders[k] = k.toLowerCase() === 'authorization' ? '[REDACTED]' : v;
  }
  const payload = {
    method: req.method,
    url: req.url,
    headers: redactedHeaders,
    ...(req.body !== undefined ? { body: req.body } : {}),
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
}
```

- [ ] **Step 5: Run tests — expect all green**

Run: `npm test -- test/lib/output.test.ts`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/output.ts test/lib/output.test.ts test/helpers/capture-output.ts
git commit -m "Add stdout/stderr/error/dryRun helpers with Authorization redaction"
```

---

## Task 3: `lib/config.ts` — config resolution + token cache + OAuth

**Goal:** The config layer owns all credential and cache concerns. It reads env + file config, performs OAuth client-credentials exchanges, and manages the token cache at `~/.pega-cli/token.json` with `0600` perms. Exposes `getConfig()`, `getToken()`, `clearToken()`.

**Files:**
- Create: `src/lib/config.ts`
- Create: `test/helpers/mock-filesystem.ts`
- Create: `test/helpers/mock-pega-api.ts`
- Test: `test/lib/config.test.ts`

**Acceptance Criteria:**
- [ ] `getConfig('default')` returns config from env vars when set.
- [ ] Env vars take precedence over file config.
- [ ] Missing required config throws `NormalizedError { code: 'INVALID_CONFIG' }`.
- [ ] `/prweb.*` is stripped from baseUrl.
- [ ] `getToken({ noCache: false, profile: 'default' })` reads valid cached token.
- [ ] `getToken` refreshes when less than 60s remain on cache.
- [ ] `getToken({ noCache: true, ... })` never reads or writes the cache file.
- [ ] `PEGA_NO_CACHE=true` env var forces noCache behavior.
- [ ] OAuth request: POST to `{baseUrl}/prweb/PRRestService/oauth2/v1/token` with `Authorization: Basic <base64>` and body `grant_type=client_credentials`.
- [ ] Token file written with mode `0o600` on non-Windows platforms.
- [ ] OAuth failures normalized to `NormalizedError`.
- [ ] `getToken({ forceFresh: true })` skips cache read but writes to cache (unless noCache).
- [ ] `clearToken(profile)` removes the profile's entry from the token file.

**Verify:** `npm test -- test/lib/config.test.ts` → all green

**Steps:**

- [ ] **Step 1: Create `test/helpers/mock-filesystem.ts`**

```typescript
import { vol } from 'memfs';

export function resetMockFs(): void {
  vol.reset();
}

export function seedFile(path: string, content: string): void {
  const parts = path.split('/').filter(Boolean);
  const fileName = parts.pop()!;
  let dir = '';
  for (const part of parts) {
    dir += '/' + part;
    vol.mkdirSync(dir, { recursive: true });
  }
  vol.writeFileSync(path, content);
}

export function readMockFile(path: string): string {
  return vol.readFileSync(path, 'utf-8') as string;
}

export function mockFileStat(path: string): { mode: number } | null {
  try {
    const s = vol.statSync(path);
    return { mode: s.mode };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Create `test/helpers/mock-pega-api.ts`**

```typescript
import nock from 'nock';

export function mockOAuthSuccess(
  baseUrl: string,
  token = 'test-token',
  expiresIn = 3600,
): nock.Scope {
  return nock(baseUrl)
    .post('/prweb/PRRestService/oauth2/v1/token', 'grant_type=client_credentials')
    .reply(200, { access_token: token, expires_in: expiresIn, token_type: 'Bearer' });
}

export function mockOAuthFailure(baseUrl: string, status = 401, body: unknown = { error: 'invalid_client' }): nock.Scope {
  return nock(baseUrl).post('/prweb/PRRestService/oauth2/v1/token').reply(status, body);
}

export function mockV2(baseUrl: string): nock.Scope {
  return nock(baseUrl);
}

export function cleanupNock(): void {
  nock.cleanAll();
  nock.restore();
  if (!nock.isActive()) nock.activate();
}
```

- [ ] **Step 3: Write failing tests**

Create `test/lib/config.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs, seedFile, readMockFile, mockFileStat } from '../helpers/mock-filesystem.js';
import { mockOAuthSuccess, mockOAuthFailure } from '../helpers/mock-pega-api.js';

// NOTE: config.ts reads HOME from process.env and uses fs. We inject a test-friendly HOME
// and the memfs fs module via jest.unstable_mockModule.

const HOME = '/home/test';
const CONFIG_PATH = `${HOME}/.pega-cli/config.json`;
const TOKEN_PATH = `${HOME}/.pega-cli/token.json`;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = HOME;
  delete process.env.PEGA_BASE_URL;
  delete process.env.PEGA_CLIENT_ID;
  delete process.env.PEGA_CLIENT_SECRET;
  delete process.env.PEGA_NO_CACHE;
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
});

// Dynamic import inside each test ensures fresh module state with mocked fs.
// We use jest.unstable_mockModule in jest.setup for ESM — see jest.config.ts.
jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { getConfig, getToken, clearToken } = await import('../../src/lib/config.js');

describe('getConfig', () => {
  test('reads from environment variables when set', () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'abc';
    process.env.PEGA_CLIENT_SECRET = 'xyz';
    const cfg = getConfig('default');
    expect(cfg).toEqual({
      baseUrl: 'https://pega.example.com',
      clientId: 'abc',
      clientSecret: 'xyz',
      profile: 'default',
    });
  });

  test('reads from config file when env vars absent', () => {
    seedFile(
      CONFIG_PATH,
      JSON.stringify({
        profiles: {
          default: { baseUrl: 'https://pega.example.com', clientId: 'fromfile', clientSecret: 's' },
        },
      }),
    );
    const cfg = getConfig('default');
    expect(cfg.clientId).toBe('fromfile');
  });

  test('env vars take precedence over file', () => {
    seedFile(
      CONFIG_PATH,
      JSON.stringify({
        profiles: { default: { baseUrl: 'https://file.pega', clientId: 'F', clientSecret: 'F' } },
      }),
    );
    process.env.PEGA_BASE_URL = 'https://env.pega';
    process.env.PEGA_CLIENT_ID = 'E';
    process.env.PEGA_CLIENT_SECRET = 'E';
    const cfg = getConfig('default');
    expect(cfg.baseUrl).toBe('https://env.pega');
    expect(cfg.clientId).toBe('E');
  });

  test('strips /prweb and suffix from baseUrl', () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com/prweb/app';
    process.env.PEGA_CLIENT_ID = 'a';
    process.env.PEGA_CLIENT_SECRET = 'b';
    expect(getConfig('default').baseUrl).toBe('https://pega.example.com');
  });

  test('throws INVALID_CONFIG when baseUrl missing', () => {
    expect(() => getConfig('default')).toThrow(
      expect.objectContaining({ code: 'INVALID_CONFIG' }),
    );
  });

  test('throws INVALID_CONFIG when clientId missing', () => {
    process.env.PEGA_BASE_URL = 'https://p';
    process.env.PEGA_CLIENT_SECRET = 'x';
    expect(() => getConfig('default')).toThrow(
      expect.objectContaining({ code: 'INVALID_CONFIG' }),
    );
  });

  test('reads named profile from config file', () => {
    seedFile(
      CONFIG_PATH,
      JSON.stringify({
        profiles: {
          prod: { baseUrl: 'https://prod.pega', clientId: 'P', clientSecret: 'P' },
        },
      }),
    );
    const cfg = getConfig('prod');
    expect(cfg.baseUrl).toBe('https://prod.pega');
    expect(cfg.profile).toBe('prod');
  });
});

describe('getToken', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 'secret';
  });

  test('returns cached token when still valid', async () => {
    seedFile(
      TOKEN_PATH,
      JSON.stringify({
        default: {
          accessToken: 'cached-t',
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        },
      }),
    );
    const t = await getToken({ noCache: false, profile: 'default' });
    expect(t.accessToken).toBe('cached-t');
  });

  test('fetches fresh token when cache expired', async () => {
    seedFile(
      TOKEN_PATH,
      JSON.stringify({
        default: {
          accessToken: 'old',
          expiresAt: new Date(Date.now() - 10_000).toISOString(),
        },
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'new-token');
    const t = await getToken({ noCache: false, profile: 'default' });
    expect(t.accessToken).toBe('new-token');
  });

  test('refreshes when less than 60 seconds remain', async () => {
    seedFile(
      TOKEN_PATH,
      JSON.stringify({
        default: {
          accessToken: 'almost-expired',
          expiresAt: new Date(Date.now() + 30_000).toISOString(),
        },
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'refreshed');
    const t = await getToken({ noCache: false, profile: 'default' });
    expect(t.accessToken).toBe('refreshed');
  });

  test('POSTs OAuth with Basic auth and grant_type=client_credentials', async () => {
    const scope = nock('https://pega.example.com')
      .post('/prweb/PRRestService/oauth2/v1/token', 'grant_type=client_credentials')
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .matchHeader('Authorization', `Basic ${Buffer.from('id:secret').toString('base64')}`)
      .reply(200, { access_token: 'hello', expires_in: 3600 });

    const t = await getToken({ noCache: true, profile: 'default' });
    expect(t.accessToken).toBe('hello');
    expect(scope.isDone()).toBe(true);
  });

  test('writes token file with 0600 mode on Unix', async () => {
    mockOAuthSuccess('https://pega.example.com', 'stored');
    await getToken({ noCache: false, profile: 'default' });
    const stat = mockFileStat(TOKEN_PATH);
    expect(stat).not.toBeNull();
    if (process.platform !== 'win32') {
      // Lower 9 bits (permissions) must be 0600.
      expect(stat!.mode & 0o777).toBe(0o600);
    }
  });

  test('noCache=true bypasses token file reads', async () => {
    seedFile(
      TOKEN_PATH,
      JSON.stringify({
        default: {
          accessToken: 'cached',
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        },
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'fresh');
    const t = await getToken({ noCache: true, profile: 'default' });
    expect(t.accessToken).toBe('fresh');
  });

  test('noCache=true never writes token file', async () => {
    mockOAuthSuccess('https://pega.example.com', 'no-write');
    await getToken({ noCache: true, profile: 'default' });
    const stat = mockFileStat(TOKEN_PATH);
    expect(stat).toBeNull();
  });

  test('PEGA_NO_CACHE=true env forces noCache behavior', async () => {
    process.env.PEGA_NO_CACHE = 'true';
    mockOAuthSuccess('https://pega.example.com', 'env-no-cache');
    await getToken({ noCache: false, profile: 'default' });
    const stat = mockFileStat(TOKEN_PATH);
    expect(stat).toBeNull();
  });

  test('OAuth failure normalizes to NormalizedError', async () => {
    mockOAuthFailure('https://pega.example.com', 401, { error: 'invalid_client' });
    await expect(getToken({ noCache: true, profile: 'default' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  test('forceFresh=true ignores valid cache but writes result', async () => {
    seedFile(
      TOKEN_PATH,
      JSON.stringify({
        default: {
          accessToken: 'cached',
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        },
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'fresh');
    const t = await getToken({ noCache: false, profile: 'default', forceFresh: true });
    expect(t.accessToken).toBe('fresh');
    const stored = JSON.parse(readMockFile(TOKEN_PATH));
    expect(stored.default.accessToken).toBe('fresh');
  });

  test('defaults expires_in to 3600s when missing', async () => {
    nock('https://pega.example.com')
      .post('/prweb/PRRestService/oauth2/v1/token')
      .reply(200, { access_token: 'no-expiry' });
    const t = await getToken({ noCache: true, profile: 'default' });
    const expiresAt = new Date(t.expiresAt).getTime();
    const diff = expiresAt - Date.now();
    expect(diff).toBeGreaterThan(3500_000);
    expect(diff).toBeLessThan(3700_000);
  });
});

describe('clearToken', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://p';
    process.env.PEGA_CLIENT_ID = 'i';
    process.env.PEGA_CLIENT_SECRET = 's';
  });

  test('removes profile entry from token file', () => {
    seedFile(
      TOKEN_PATH,
      JSON.stringify({
        default: { accessToken: 'x', expiresAt: '2099-01-01T00:00:00Z' },
        prod: { accessToken: 'y', expiresAt: '2099-01-01T00:00:00Z' },
      }),
    );
    clearToken('default');
    const stored = JSON.parse(readMockFile(TOKEN_PATH));
    expect(stored.default).toBeUndefined();
    expect(stored.prod).toBeDefined();
  });

  test('no-op when token file does not exist', () => {
    expect(() => clearToken('default')).not.toThrow();
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- test/lib/config.test.ts`
Expected: module not found.

- [ ] **Step 5: Implement `src/lib/config.ts`**

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fromHttpResponse, fromNetworkError, type NormalizedError } from './errors.js';

export interface PegaConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  profile: string;
}

export interface TokenResult {
  accessToken: string;
  expiresAt: string;
}

interface FileConfigShape {
  profiles?: Record<string, Partial<Omit<PegaConfig, 'profile'>>>;
}

interface TokenFileShape {
  [profile: string]: { accessToken: string; expiresAt: string };
}

const REFRESH_BUFFER_MS = 60_000;

function configDir(): string {
  return path.join(os.homedir(), '.pega-cli');
}
function configPath(): string {
  return path.join(configDir(), 'config.json');
}
function tokenPath(): string {
  return path.join(configDir(), 'token.json');
}

function invalidConfig(message: string): NormalizedError {
  return { code: 'INVALID_CONFIG', message, httpStatus: 0 };
}

function stripPrweb(url: string): string {
  return url.replace(/\/prweb.*$/, '');
}

function readFileConfig(): FileConfigShape {
  try {
    const contents = fs.readFileSync(configPath(), 'utf-8');
    return JSON.parse(contents);
  } catch {
    return {};
  }
}

export function getConfig(profile = 'default'): PegaConfig {
  const fileCfg = readFileConfig();
  const profileCfg = fileCfg.profiles?.[profile] ?? {};
  const baseUrlRaw =
    process.env.PEGA_BASE_URL ?? profileCfg.baseUrl ?? undefined;
  const clientId = process.env.PEGA_CLIENT_ID ?? profileCfg.clientId ?? undefined;
  const clientSecret =
    process.env.PEGA_CLIENT_SECRET ?? profileCfg.clientSecret ?? undefined;

  if (!baseUrlRaw) throw invalidConfig('PEGA_BASE_URL is not set');
  if (!clientId) throw invalidConfig('PEGA_CLIENT_ID is not set');
  if (!clientSecret) throw invalidConfig('PEGA_CLIENT_SECRET is not set');

  return {
    baseUrl: stripPrweb(baseUrlRaw),
    clientId,
    clientSecret,
    profile,
  };
}

function readTokenFile(): TokenFileShape {
  try {
    return JSON.parse(fs.readFileSync(tokenPath(), 'utf-8'));
  } catch {
    return {};
  }
}

function writeTokenFile(data: TokenFileShape): void {
  const dir = configDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(tokenPath(), JSON.stringify(data, null, 2), { mode: 0o600 });
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(tokenPath(), 0o600);
    } catch {
      /* chmod may not be supported on all filesystems */
    }
  }
}

function isNoCache(noCache: boolean): boolean {
  return noCache || process.env.PEGA_NO_CACHE === 'true';
}

async function fetchToken(cfg: PegaConfig): Promise<TokenResult> {
  const url = `${cfg.baseUrl}/prweb/PRRestService/oauth2/v1/token`;
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      body: 'grant_type=client_credentials',
    });
  } catch (err) {
    throw fromNetworkError(err as Error);
  }

  if (!response.ok) {
    let body: unknown = {};
    try {
      body = await response.json();
    } catch {
      /* ignore parse errors */
    }
    throw fromHttpResponse(response, body);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw { code: 'OAUTH_INVALID_RESPONSE', message: 'OAuth response missing access_token', httpStatus: response.status } satisfies NormalizedError;
  }
  const expiresIn = data.expires_in ?? 3600;
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

export async function getToken(opts: {
  noCache: boolean;
  profile: string;
  forceFresh?: boolean;
}): Promise<TokenResult> {
  const noCache = isNoCache(opts.noCache);
  const cfg = getConfig(opts.profile);

  if (!noCache && !opts.forceFresh) {
    const store = readTokenFile();
    const cached = store[opts.profile];
    if (cached) {
      const remaining = new Date(cached.expiresAt).getTime() - Date.now();
      if (remaining > REFRESH_BUFFER_MS) {
        return cached;
      }
    }
  }

  const fresh = await fetchToken(cfg);

  if (!noCache) {
    const store = readTokenFile();
    store[opts.profile] = fresh;
    writeTokenFile(store);
  }

  return fresh;
}

export function clearToken(profile: string): void {
  let store: TokenFileShape;
  try {
    store = readTokenFile();
  } catch {
    return;
  }
  if (!store[profile]) return;
  delete store[profile];
  writeTokenFile(store);
}
```

- [ ] **Step 6: Run tests — expect all green**

Run: `npm test -- test/lib/config.test.ts`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/config.ts test/lib/config.test.ts test/helpers/mock-filesystem.ts test/helpers/mock-pega-api.ts
git commit -m "Add config resolution, token cache, and OAuth exchange"
```

---

## Task 4: `lib/api-client.ts` — Pega V2 HTTP client

**Goal:** Thin HTTP client with OAuth header injection via `TokenProvider`, standard V2 headers, 45s extended timeout support, and full error normalization.

**Files:**
- Create: `src/lib/api-client.ts`
- Test: `test/lib/api-client.test.ts`

**Acceptance Criteria:**
- [ ] `get()`, `post()`, `patch()`, `delete()` all inject `Authorization: Bearer <token>`.
- [ ] Default headers include `Content-Type: application/json`, `Accept: application/json`, `x-origin-channel: Web`.
- [ ] `post()`/`patch()` JSON-encode the body.
- [ ] 200 returns parsed JSON body.
- [ ] 204 / empty body returns `{}` or parses as empty.
- [ ] ETag header from response is exposed (needed for `assignments perform`).
- [ ] Non-2xx responses throw `NormalizedError` (never raw fetch errors).
- [ ] AbortError on timeout → `TIMEOUT` code.
- [ ] Network error → `NETWORK_ERROR`.
- [ ] `extraHeaders` on RequestOpts are merged (and override defaults).
- [ ] `onVerbose` callback invoked with request and response details.

**Verify:** `npm test -- test/lib/api-client.test.ts` → all green

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `test/lib/api-client.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { createPegaApiClient } from '../../src/lib/api-client.js';

const BASE = 'https://pega.example.com';
const V2 = `${BASE}/prweb/api/application/v2`;

function client(tokenValue = 'test-token') {
  return createPegaApiClient({
    baseUrl: BASE,
    tokenProvider: async () => tokenValue,
  });
}

beforeEach(() => {
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
});

describe('createPegaApiClient', () => {
  test('GET injects Authorization: Bearer header', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/C-1')
      .matchHeader('Authorization', 'Bearer test-token')
      .matchHeader('Accept', 'application/json')
      .matchHeader('x-origin-channel', 'Web')
      .reply(200, { id: 'C-1' });

    const c = client();
    const res = await c.get<{ id: string }>('/cases/C-1');
    expect(res).toEqual({ id: 'C-1' });
  });

  test('POST JSON-encodes body and sets Content-Type', async () => {
    nock(BASE)
      .post('/prweb/api/application/v2/cases', { caseTypeID: 'X' })
      .matchHeader('Content-Type', 'application/json')
      .reply(201, { id: 'NEW' });

    const res = await client().post<{ id: string }>('/cases', { caseTypeID: 'X' });
    expect(res).toEqual({ id: 'NEW' });
  });

  test('PATCH with extraHeaders merges If-Match', async () => {
    nock(BASE)
      .patch('/prweb/api/application/v2/assignments/A-1/actions/Act', { content: { x: 1 } })
      .matchHeader('If-Match', 'etag-xyz')
      .reply(200, { updated: true });

    const res = await client().patch('/assignments/A-1/actions/Act', { content: { x: 1 } }, {
      extraHeaders: { 'If-Match': 'etag-xyz' },
    });
    expect(res).toEqual({ updated: true });
  });

  test('DELETE with empty response body resolves to empty object', async () => {
    nock(BASE)
      .delete('/prweb/api/application/v2/cases/C-1')
      .reply(204);

    const res = await client().delete<Record<string, unknown>>('/cases/C-1');
    expect(res).toEqual({});
  });

  test('exposes ETag from response when includeResponse option requested', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1' }, { ETag: '"abc123"' });

    const res = await client().getWithMeta<{ id: string }>('/assignments/A-1');
    expect(res.data).toEqual({ id: 'A-1' });
    expect(res.eTag).toBe('"abc123"');
  });

  test('404 throws NOT_FOUND NormalizedError', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/MISSING')
      .reply(404, { localizedValue: 'Case not found', errors: [{ ID: 'ERR-1' }] });

    await expect(client().get('/cases/MISSING')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      httpStatus: 404,
      pegaErrorId: 'ERR-1',
    });
  });

  test('401 throws UNAUTHORIZED', async () => {
    nock(BASE).get('/prweb/api/application/v2/cases/X').reply(401, {});
    await expect(client().get('/cases/X')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('429 throws RATE_LIMITED', async () => {
    nock(BASE).get('/prweb/api/application/v2/cases/X').reply(429, {});
    await expect(client().get('/cases/X')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  test('network error throws NETWORK_ERROR', async () => {
    nock(BASE).get('/prweb/api/application/v2/cases/X').replyWithError('socket hang up');
    await expect(client().get('/cases/X')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  test('timeout throws TIMEOUT', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/X')
      .delay(100)
      .reply(200, {});
    await expect(
      client().get('/cases/X', { timeoutMs: 10 }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  test('invokes onVerbose with request and response details', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1' });

    const calls: Array<{ req: unknown; res: unknown }> = [];
    const c = createPegaApiClient({
      baseUrl: BASE,
      tokenProvider: async () => 'tok',
      onVerbose: (req, res) => calls.push({ req, res }),
    });
    await c.get('/cases/C-1');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.req).toMatchObject({ method: 'GET', url: `${V2}/cases/C-1` });
    expect(calls[0]!.res).toMatchObject({ status: 200 });
  });

  test('extraHeaders override default headers', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/X')
      .matchHeader('x-origin-channel', 'Mobile')
      .reply(200, {});
    await client().get('/cases/X', { extraHeaders: { 'x-origin-channel': 'Mobile' } });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/lib/api-client.test.ts`
Expected: module not found.

- [ ] **Step 3: Implement `src/lib/api-client.ts`**

```typescript
import { fromHttpResponse, fromNetworkError, type NormalizedError } from './errors.js';

export interface RequestOpts {
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
}

export interface LoggedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface LoggedResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface ResponseWithMeta<T> {
  data: T;
  eTag?: string;
  status: number;
}

export interface PegaApiClient {
  get<T>(path: string, opts?: RequestOpts): Promise<T>;
  post<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  patch<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  delete<T>(path: string, opts?: RequestOpts): Promise<T>;
  getWithMeta<T>(path: string, opts?: RequestOpts): Promise<ResponseWithMeta<T>>;
}

export interface PegaApiClientDeps {
  baseUrl: string;
  tokenProvider: () => Promise<string>;
  onVerbose?: (req: LoggedRequest, res: LoggedResponse) => void;
}

const DEFAULT_TIMEOUT_MS = 15_000;

function v2Root(baseUrl: string): string {
  return `${baseUrl}/prweb/api/application/v2`;
}

function buildHeaders(token: string, extras: Record<string, string> = {}, bodyPresent = false): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'x-origin-channel': 'Web',
  };
  if (bodyPresent) headers['Content-Type'] = 'application/json';
  for (const [k, v] of Object.entries(extras)) headers[k] = v;
  return headers;
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 204) return {};
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text ? { message: text } : {};
  }
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function doRequest<T>(
  deps: PegaApiClientDeps,
  method: string,
  path: string,
  body: unknown,
  opts: RequestOpts = {},
): Promise<ResponseWithMeta<T>> {
  const token = await deps.tokenProvider();
  const url = `${v2Root(deps.baseUrl)}${path}`;
  const hasBody = body !== undefined && method !== 'GET' && method !== 'DELETE';
  const headers = buildHeaders(token, opts.extraHeaders, hasBody);
  const serialized = hasBody ? JSON.stringify(body) : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: serialized,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw fromNetworkError(err as Error);
  }
  clearTimeout(timeout);

  const parsed = await parseBody(response);
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    responseHeaders[k] = v;
  });

  deps.onVerbose?.(
    { method, url, headers, body: serialized },
    { status: response.status, headers: responseHeaders, body: parsed },
  );

  if (!response.ok) {
    throw fromHttpResponse(response, parsed);
  }

  const eTag = response.headers.get('etag') ?? undefined;
  return { data: parsed as T, eTag, status: response.status };
}

export function createPegaApiClient(deps: PegaApiClientDeps): PegaApiClient {
  return {
    async get<T>(path: string, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'GET', path, undefined, opts);
      return r.data;
    },
    async post<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'POST', path, body, opts);
      return r.data;
    },
    async patch<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'PATCH', path, body, opts);
      return r.data;
    },
    async delete<T>(path: string, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'DELETE', path, undefined, opts);
      return r.data;
    },
    async getWithMeta<T>(path: string, opts?: RequestOpts): Promise<ResponseWithMeta<T>> {
      return doRequest<T>(deps, 'GET', path, undefined, opts);
    },
  };
}
```

- [ ] **Step 4: Run tests — expect all green**

Run: `npm test -- test/lib/api-client.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api-client.ts test/lib/api-client.test.ts
git commit -m "Add PegaApiClient with TokenProvider seam and error normalization"
```

---

## Task 5: `base-command.ts` — shared flags, helpers

**Goal:** BaseCommand class that every command extends. Inherits 7 global flags, provides `getClient()`, `emit()`, `emitDryRun()`, `fail()`.

**Files:**
- Create: `src/base-command.ts`
- Create: `src/lib/input.ts` (for `readDataFlag` helper — needed here by design, used by Tasks 7 and 8)
- Test: `test/base-command.test.ts`
- Test: `test/lib/input.test.ts`

**Acceptance Criteria:**
- [ ] `BaseCommand.baseFlags` exposes all 7 flags with correct defaults.
- [ ] `getClient(flags)` constructs a PegaApiClient using config.getToken under the hood.
- [ ] `emit(data, flags)` delegates to output.stdout with format + fields.
- [ ] `emitDryRun(req)` delegates to output.dryRun.
- [ ] `fail(err)` emits structured error and calls `this.exit(1)`.
- [ ] `readDataFlag('{"a":1}')` → `{ a: 1 }`.
- [ ] `readDataFlag('@/path/to/file.json')` reads and parses the file.
- [ ] `readDataFlag('-')` reads stdin and parses.
- [ ] Invalid JSON → throws `NormalizedError { code: 'INVALID_ARGS' }`.

**Verify:** `npm test -- test/base-command.test.ts test/lib/input.test.ts` → all green

**Steps:**

- [ ] **Step 1: Write failing tests for input helper**

Create `test/lib/input.test.ts`:

```typescript
import { describe, test, expect, jest } from '@jest/globals';
import { resetMockFs, seedFile } from '../helpers/mock-filesystem.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { readDataFlag } = await import('../../src/lib/input.js');

describe('readDataFlag', () => {
  test('parses inline JSON', async () => {
    expect(await readDataFlag('{"a":1}')).toEqual({ a: 1 });
  });

  test('reads and parses @file.json', async () => {
    resetMockFs();
    seedFile('/tmp/data.json', '{"k":"v"}');
    expect(await readDataFlag('@/tmp/data.json')).toEqual({ k: 'v' });
  });

  test('invalid JSON throws INVALID_ARGS', async () => {
    await expect(readDataFlag('{bad')).rejects.toMatchObject({ code: 'INVALID_ARGS' });
  });

  test('reads from stdin when value is "-"', async () => {
    const stdin = '{"fromStdin":true}';
    // Mock process.stdin as a readable stream.
    const { Readable } = await import('node:stream');
    const orig = process.stdin;
    const mock = Readable.from([stdin]);
    Object.defineProperty(process, 'stdin', { value: mock, configurable: true });
    try {
      expect(await readDataFlag('-')).toEqual({ fromStdin: true });
    } finally {
      Object.defineProperty(process, 'stdin', { value: orig, configurable: true });
    }
  });
});
```

- [ ] **Step 2: Implement `src/lib/input.ts`**

```typescript
import * as fs from 'node:fs';
import type { NormalizedError } from './errors.js';

function invalidArgs(message: string): NormalizedError {
  return { code: 'INVALID_ARGS', message, httpStatus: 0 };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export async function readDataFlag(value: string): Promise<unknown> {
  let raw: string;
  if (value === '-') {
    raw = await readStdin();
  } else if (value.startsWith('@')) {
    try {
      raw = fs.readFileSync(value.slice(1), 'utf-8');
    } catch (err) {
      throw invalidArgs(`Cannot read data file ${value.slice(1)}: ${(err as Error).message}`);
    }
  } else {
    raw = value;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw invalidArgs(`Invalid JSON in --data: ${(err as Error).message}`);
  }
}
```

- [ ] **Step 3: Write failing tests for BaseCommand**

Create `test/base-command.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from './helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from './helpers/capture-output.js';
import { mockOAuthSuccess } from './helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { BaseCommand } = await import('../src/base-command.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('BaseCommand.baseFlags', () => {
  test('declares all 7 global flags', () => {
    const flags = BaseCommand.baseFlags as Record<string, unknown>;
    for (const name of ['format', 'fields', 'dry-run', 'quiet', 'verbose', 'no-cache', 'profile']) {
      expect(flags[name]).toBeDefined();
    }
  });
});

// Concrete test command that exercises base-command helpers.
class TestCmd extends BaseCommand {
  static override description = 'test command';
  async run(): Promise<void> {
    const { flags } = await this.parse(TestCmd);
    const client = await this.getClient(flags);
    const data = await client.get<{ id: string }>('/cases/C-1');
    this.emit(data, flags);
  }
}

describe('getClient + emit', () => {
  test('getClient wires a working PegaApiClient', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1' });

    captured = captureOutput();
    await TestCmd.run([]);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'C-1' });
  });

  test('emit respects --fields', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1', extra: 'drop', keep: 'me' });

    captured = captureOutput();
    await TestCmd.run(['--fields', 'id,keep']);
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed).toEqual({ id: 'C-1', keep: 'me' });
  });
});
```

- [ ] **Step 4: Implement `src/base-command.ts`**

```typescript
import { Command, Flags, Interfaces } from '@oclif/core';
import { createPegaApiClient, type PegaApiClient } from './lib/api-client.js';
import { getConfig, getToken } from './lib/config.js';
import { stdout, stderr, error, dryRun, type DryRunRequest } from './lib/output.js';
import { isNormalizedError, type NormalizedError } from './lib/errors.js';

export type BaseFlags = Interfaces.InferredFlags<typeof BaseCommand.baseFlags>;

export abstract class BaseCommand extends Command {
  static override baseFlags = {
    format: Flags.string({
      description: 'Output format (json, compact)',
      options: ['json', 'compact'],
      default: 'json',
    }),
    fields: Flags.string({
      description: 'Comma-separated top-level fields to include in output',
    }),
    'dry-run': Flags.boolean({
      description: 'Print HTTP request details and exit without executing',
      default: false,
    }),
    quiet: Flags.boolean({
      description: 'Suppress all stderr output',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Emit full HTTP request/response details to stderr',
      default: false,
    }),
    'no-cache': Flags.boolean({
      description: 'Bypass token file cache; perform fresh OAuth exchange',
      default: false,
    }),
    profile: Flags.string({
      description: 'Named config profile',
      default: 'default',
    }),
  };

  protected async getClient(flags: BaseFlags): Promise<PegaApiClient> {
    const cfg = getConfig(flags.profile);
    const noCache = flags['no-cache'];
    return createPegaApiClient({
      baseUrl: cfg.baseUrl,
      tokenProvider: async () => {
        const token = await getToken({ noCache, profile: flags.profile });
        return token.accessToken;
      },
      onVerbose: flags.verbose
        ? (req, res) => {
            stderr(`→ ${req.method} ${req.url}`, { quiet: flags.quiet });
            stderr(`← ${res.status}`, { quiet: flags.quiet });
          }
        : undefined,
    });
  }

  protected emit(data: unknown, flags: BaseFlags): void {
    stdout(data, { format: flags.format as 'json' | 'compact', fields: flags.fields });
  }

  protected emitDryRun(req: DryRunRequest): void {
    dryRun(req);
  }

  protected fail(err: unknown): never {
    const normalized: NormalizedError = isNormalizedError(err)
      ? err
      : { code: 'UNKNOWN', message: (err as Error).message ?? 'Unknown error', httpStatus: 0 };
    error(normalized);
    this.exit(1);
  }

  async catch(err: Error & { oclif?: { exit?: number } }): Promise<never> {
    // oclif parse/validation errors surface here — let them exit with their own code (usually 2)
    if (err.oclif?.exit !== undefined) throw err;
    this.fail(err);
  }
}
```

- [ ] **Step 5: Run tests — expect all green**

Run: `npm test -- test/lib/input.test.ts test/base-command.test.ts`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/base-command.ts src/lib/input.ts test/base-command.test.ts test/lib/input.test.ts
git commit -m "Add BaseCommand with global flags and readDataFlag helper"
```

---

## Task 6: `auth` command group — login, ping, diagnose

**Goal:** Implement the three `pega auth` commands. All 3 follow the BaseCommand pattern.

**Files:**
- Create: `src/commands/auth/login.ts`
- Create: `src/commands/auth/ping.ts`
- Create: `src/commands/auth/diagnose.ts`
- Test: `test/commands/auth/login.test.ts`
- Test: `test/commands/auth/ping.test.ts`
- Test: `test/commands/auth/diagnose.test.ts`

**Acceptance Criteria:**
- [ ] `pega auth login` outputs `{ authenticated: true, expiresAt: <ISO> }` on success; exit 1 on OAuth failure.
- [ ] `pega auth login` always forces a fresh OAuth exchange (clears cache first).
- [ ] `pega auth login --no-cache` does not write to token file.
- [ ] `pega auth login --dry-run` prints the OAuth token request (redacted) and exits 0.
- [ ] `pega auth ping` outputs `{ reachable: true, responseTimeMs: <number> }` on success (exit 0).
- [ ] `pega auth ping` outputs `{ reachable: false, error: "..." }` on failure (still exit 0).
- [ ] `pega auth diagnose` runs 4 checks (baseUrl, credentials, oauth, apiV2) and outputs `{ checks: [...], overall: "pass"|"fail" }`.
- [ ] `pega auth diagnose` always exits 0 — it reports failures, doesn't propagate them.

**Verify:** `npm test -- test/commands/auth/` → all green

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `test/commands/auth/login.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, mockOAuthFailure } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AuthLogin } = await import('../../../src/commands/auth/login.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  delete process.env.PEGA_NO_CACHE;
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('auth login', () => {
  test('outputs authenticated:true with expiresAt on success', async () => {
    mockOAuthSuccess('https://pega.example.com', 'tk', 3600);
    captured = captureOutput();
    await AuthLogin.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.authenticated).toBe(true);
    expect(new Date(out.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  test('--dry-run prints OAuth request with redacted Authorization and exits 0', async () => {
    captured = captureOutput();
    await AuthLogin.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toContain('/prweb/PRRestService/oauth2/v1/token');
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.body).toBe('grant_type=client_credentials');
  });

  test('failed OAuth emits structured error and exits 1', async () => {
    mockOAuthFailure('https://pega.example.com', 401);
    captured = captureOutput();
    await expect(AuthLogin.run([])).rejects.toThrow();
    const err = JSON.parse(captured.stderr.join(''));
    expect(err.error).toBe(true);
    expect(err.code).toBe('UNAUTHORIZED');
  });
});
```

Create `test/commands/auth/ping.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AuthPing } = await import('../../../src/commands/auth/ping.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('auth ping', () => {
  test('reports reachable:true with responseTimeMs on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(200, { caseTypes: [] });

    captured = captureOutput();
    await AuthPing.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.reachable).toBe(true);
    expect(typeof out.responseTimeMs).toBe('number');
  });

  test('reports reachable:false with error message on failure (exit 0)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(503, {});

    captured = captureOutput();
    await AuthPing.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.reachable).toBe(false);
    expect(out.error).toBeDefined();
  });

  test('--dry-run prints redacted GET request and exits 0 without network', async () => {
    captured = captureOutput();
    await AuthPing.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/casetypes');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });
});
```

Create `test/commands/auth/diagnose.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, mockOAuthFailure } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AuthDiagnose } = await import('../../../src/commands/auth/diagnose.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('auth diagnose', () => {
  test('reports overall:pass when all checks pass', async () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 's';
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(200, { caseTypes: [] });

    captured = captureOutput();
    await AuthDiagnose.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.overall).toBe('pass');
    expect(out.checks.map((c: { name: string }) => c.name)).toEqual([
      'baseUrl',
      'credentials',
      'oauth',
      'apiV2',
    ]);
    expect(out.checks.every((c: { status: string }) => c.status === 'pass')).toBe(true);
  });

  test('reports overall:fail when baseUrl missing', async () => {
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    captured = captureOutput();
    await AuthDiagnose.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.overall).toBe('fail');
    expect(out.checks[0].status).toBe('fail');
  });

  test('reports oauth:fail when credentials are wrong', async () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 'wrong';
    mockOAuthFailure('https://pega.example.com', 401);
    captured = captureOutput();
    await AuthDiagnose.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.overall).toBe('fail');
    const oauthCheck = out.checks.find((c: { name: string }) => c.name === 'oauth');
    expect(oauthCheck.status).toBe('fail');
  });

  test('always exits 0 even when checks fail', async () => {
    delete process.env.PEGA_BASE_URL;
    captured = captureOutput();
    // Should resolve, not reject, even on fail.
    await expect(AuthDiagnose.run([])).resolves.toBeUndefined();
  });

  test('--dry-run prints OAuth request with redacted Authorization and exits 0', async () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 's';
    captured = captureOutput();
    await AuthDiagnose.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toContain('/oauth2/v1/token');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });
});
```

- [ ] **Step 2: Implement `src/commands/auth/login.ts`**

```typescript
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { clearToken, getConfig, getToken } from '../../lib/config.js';

export default class AuthLogin extends BaseCommand {
  static override description = 'Acquire a fresh OAuth token and cache it';
  static override examples = ['<%= config.bin %> auth login'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);

    if (baseFlags['dry-run']) {
      const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
      this.emitDryRun({
        method: 'POST',
        url: `${cfg.baseUrl}/prweb/PRRestService/oauth2/v1/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basic}`,
        },
        body: 'grant_type=client_credentials',
      });
      return;
    }

    try {
      clearToken(baseFlags.profile);
      const token = await getToken({
        noCache: baseFlags['no-cache'],
        profile: baseFlags.profile,
        forceFresh: true,
      });
      this.emit({ authenticated: true, expiresAt: token.expiresAt }, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
```

- [ ] **Step 3: Implement `src/commands/auth/ping.ts`**

```typescript
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { isNormalizedError } from '../../lib/errors.js';

export default class AuthPing extends BaseCommand {
  static override description = 'Check Pega API V2 reachability';
  static override examples = ['<%= config.bin %> auth ping'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthPing);
    const baseFlags = flags as unknown as BaseFlags;

    if (baseFlags['dry-run']) {
      const cfg = getConfig(baseFlags.profile);
      this.emitDryRun({
        method: 'GET',
        url: `${cfg.baseUrl}/prweb/api/application/v2/casetypes`,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    const start = performance.now();
    try {
      const client = await this.getClient(baseFlags);
      await client.get('/casetypes');
      const responseTimeMs = Math.round(performance.now() - start);
      this.emit({ reachable: true, responseTimeMs }, baseFlags);
    } catch (err) {
      const message = isNormalizedError(err) ? err.message : (err as Error).message;
      this.emit({ reachable: false, error: message }, baseFlags);
    }
  }
}
```

- [ ] **Step 4: Implement `src/commands/auth/diagnose.ts`**

```typescript
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig, getToken } from '../../lib/config.js';
import { createPegaApiClient } from '../../lib/api-client.js';
import { isNormalizedError } from '../../lib/errors.js';

interface Check {
  name: 'baseUrl' | 'credentials' | 'oauth' | 'apiV2';
  status: 'pass' | 'fail';
  detail: string;
}

export default class AuthDiagnose extends BaseCommand {
  static override description = 'Run diagnostic checks against Pega configuration';
  static override examples = ['<%= config.bin %> auth diagnose'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthDiagnose);
    const baseFlags = flags as unknown as BaseFlags;

    if (baseFlags['dry-run']) {
      // Diagnose's first network action is the OAuth exchange; show that.
      let baseUrl = '<unresolved>';
      let clientId = '';
      let clientSecret = '';
      try {
        const cfg = getConfig(baseFlags.profile);
        baseUrl = cfg.baseUrl;
        clientId = cfg.clientId;
        clientSecret = cfg.clientSecret;
      } catch {
        /* config incomplete — still show what we'd try */
      }
      const basic = clientId && clientSecret
        ? Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        : '<missing-credentials>';
      this.emitDryRun({
        method: 'POST',
        url: `${baseUrl}/prweb/PRRestService/oauth2/v1/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basic}`,
        },
        body: 'grant_type=client_credentials',
      });
      return;
    }

    const checks: Check[] = [];

    let cfg: Awaited<ReturnType<typeof getConfig>> | null = null;
    try {
      cfg = getConfig(baseFlags.profile);
      checks.push({ name: 'baseUrl', status: 'pass', detail: cfg.baseUrl });
    } catch (err) {
      const msg = isNormalizedError(err) ? err.message : (err as Error).message;
      checks.push({ name: 'baseUrl', status: 'fail', detail: msg });
      checks.push({ name: 'credentials', status: 'fail', detail: 'skipped (baseUrl missing)' });
      checks.push({ name: 'oauth', status: 'fail', detail: 'skipped (baseUrl missing)' });
      checks.push({ name: 'apiV2', status: 'fail', detail: 'skipped (baseUrl missing)' });
      this.emit({ checks, overall: 'fail' }, baseFlags);
      return;
    }

    const hasCreds = Boolean(cfg.clientId && cfg.clientSecret);
    checks.push({
      name: 'credentials',
      status: hasCreds ? 'pass' : 'fail',
      detail: hasCreds ? 'clientId and clientSecret present' : 'Missing credentials',
    });

    let accessToken: string | null = null;
    try {
      const tk = await getToken({ noCache: baseFlags['no-cache'], profile: baseFlags.profile });
      accessToken = tk.accessToken;
      checks.push({ name: 'oauth', status: 'pass', detail: 'Token acquired successfully' });
    } catch (err) {
      const msg = isNormalizedError(err) ? err.message : (err as Error).message;
      checks.push({ name: 'oauth', status: 'fail', detail: msg });
      checks.push({ name: 'apiV2', status: 'fail', detail: 'skipped (oauth failed)' });
      this.emit({ checks, overall: 'fail' }, baseFlags);
      return;
    }

    try {
      const client = createPegaApiClient({
        baseUrl: cfg.baseUrl,
        tokenProvider: async () => accessToken!,
      });
      await client.get('/casetypes');
      checks.push({ name: 'apiV2', status: 'pass', detail: 'Constellation DX API reachable' });
    } catch (err) {
      const msg = isNormalizedError(err) ? err.message : (err as Error).message;
      checks.push({ name: 'apiV2', status: 'fail', detail: msg });
    }

    const overall = checks.every((c) => c.status === 'pass') ? 'pass' : 'fail';
    this.emit({ checks, overall }, baseFlags);
  }
}
```

- [ ] **Step 5: Run tests — expect all green**

Run: `npm test -- test/commands/auth/`
Expected: all pass. If not, iterate red-green.

- [ ] **Step 6: Manual smoke**

Run:
```bash
npm run build
./bin/run.js auth --help
./bin/run.js auth login --help
./bin/run.js auth ping --dry-run
```
Expected: help banners render cleanly; `--dry-run` prints a JSON request object.

- [ ] **Step 7: Commit**

```bash
git add src/commands/auth/ test/commands/auth/
git commit -m "Implement auth login/ping/diagnose commands"
```

---

## Task 7: `cases` command group — get, create, delete

**Goal:** Implement the three `pega cases` commands. `create` uses `readDataFlag` for flexible input.

**Files:**
- Create: `src/commands/cases/get.ts`
- Create: `src/commands/cases/create.ts`
- Create: `src/commands/cases/delete.ts`
- Test: `test/commands/cases/get.test.ts`
- Test: `test/commands/cases/create.test.ts`
- Test: `test/commands/cases/delete.test.ts`

**Acceptance Criteria:**
- [ ] `pega cases get <caseId>` calls `GET /cases/{encodedCaseId}` and emits response JSON.
- [ ] `pega cases get <caseId> --dry-run` prints redacted request and exits 0 without network call.
- [ ] `pega cases get --fields status,urgency` filters output.
- [ ] `pega cases create --type X` POSTs `{ caseTypeID: "X" }` to `/cases`.
- [ ] `pega cases create --type X --data @file.json` merges JSON into `content` on request body.
- [ ] `pega cases delete <caseId>` calls DELETE and emits `{ deleted: true, caseId }`.
- [ ] 404 errors emit structured error and exit 1 for all three commands.

**Verify:** `npm test -- test/commands/cases/` → all green

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `test/commands/cases/get.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CasesGet } = await import('../../../src/commands/cases/get.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('cases get', () => {
  test('emits case JSON on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1', status: 'Open' });

    captured = captureOutput();
    await CasesGet.run(['MYAPP-CASE-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'MYAPP-CASE-1', status: 'Open' });
  });

  test('URL-encodes the case ID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MY%20APP-CASE-1')
      .reply(200, { id: 'x' });

    captured = captureOutput();
    await CasesGet.run(['MY APP-CASE-1']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('x');
  });

  test('--dry-run prints redacted request and exits 0 without network call', async () => {
    captured = captureOutput();
    await CasesGet.run(['C-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/cases/C-1');
    expect(out.headers.Authorization).toBe('[REDACTED]');
    // No nock intercept set up, so if a request were made the test would fail.
  });

  test('--fields filters top-level keys', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1', status: 'Open', extraField: 'drop' });

    captured = captureOutput();
    await CasesGet.run(['C-1', '--fields', 'id,status']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'C-1', status: 'Open' });
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MISSING')
      .reply(404, { localizedValue: 'Case not found' });

    captured = captureOutput();
    await expect(CasesGet.run(['MISSING'])).rejects.toThrow();
    const err = JSON.parse(captured.stderr.join(''));
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
```

Create `test/commands/cases/create.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs, seedFile } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CasesCreate } = await import('../../../src/commands/cases/create.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('cases create', () => {
  test('POSTs { caseTypeID } with no data', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases', { caseTypeID: 'Claim' })
      .reply(201, { id: 'NEW' });

    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('NEW');
  });

  test('POSTs { caseTypeID, content } with inline --data', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases', {
        caseTypeID: 'Claim',
        content: { policyNumber: '12345' },
      })
      .reply(201, { id: 'NEW' });

    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim', '--data', '{"policyNumber":"12345"}']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('NEW');
  });

  test('reads @file.json for --data', async () => {
    seedFile('/tmp/claim.json', '{"policyNumber":"99999"}');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases', {
        caseTypeID: 'Claim',
        content: { policyNumber: '99999' },
      })
      .reply(201, { id: 'F' });

    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim', '--data', '@/tmp/claim.json']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('F');
  });

  test('invalid --data JSON exits 2 with INVALID_ARGS', async () => {
    captured = captureOutput();
    await expect(CasesCreate.run(['--type', 'Claim', '--data', '{bad'])).rejects.toThrow();
    const err = JSON.parse(captured.stderr.join(''));
    expect(err.code).toBe('INVALID_ARGS');
  });

  test('--dry-run shows body without hitting network', async () => {
    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim', '--data', '{"k":"v"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.body).toEqual({ caseTypeID: 'Claim', content: { k: 'v' } });
  });
});
```

Create `test/commands/cases/delete.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CasesDelete } = await import('../../../src/commands/cases/delete.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('cases delete', () => {
  test('emits { deleted: true, caseId } on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/cases/C-1')
      .reply(204);

    captured = captureOutput();
    await CasesDelete.run(['C-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ deleted: true, caseId: 'C-1' });
  });

  test('--dry-run skips network', async () => {
    captured = captureOutput();
    await CasesDelete.run(['C-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('DELETE');
    expect(out.url).toContain('/cases/C-1');
  });
});
```

- [ ] **Step 2: Implement `src/commands/cases/get.ts`**

```typescript
import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export default class CasesGet extends BaseCommand {
  static override description = 'Get a Pega case by ID';
  static override examples = ['<%= config.bin %> cases get MYAPP-CASE-1 --fields status,urgency'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Full case handle' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesGet);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const path = `/cases/${encodeURIComponent(args.caseId)}`;
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'GET',
        url,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      const result = await client.get(path);
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
```

- [ ] **Step 3: Implement `src/commands/cases/create.ts`**

```typescript
import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { readDataFlag } from '../../lib/input.js';

export default class CasesCreate extends BaseCommand {
  static override description = 'Create a new Pega case (V2)';
  static override examples = [
    '<%= config.bin %> cases create --type InsuranceClaim',
    '<%= config.bin %> cases create --type InsuranceClaim --data @claim.json',
  ];
  static override flags = {
    type: Flags.string({ required: true, description: 'Case type ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or - for stdin)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(CasesCreate);
    const baseFlags = flags as unknown as BaseFlags;

    let content: unknown = undefined;
    if (flags.data) {
      try {
        content = await readDataFlag(flags.data);
      } catch (err) {
        this.fail(err);
      }
    }

    const body: Record<string, unknown> = { caseTypeID: flags.type };
    if (content !== undefined) body.content = content;

    const cfg = getConfig(baseFlags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2/cases`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'POST',
        url,
        headers: {
          Authorization: 'Bearer <token>',
          'Content-Type': 'application/json',
          'x-origin-channel': 'Web',
        },
        body,
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      const result = await client.post('/cases', body);
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
```

- [ ] **Step 4: Implement `src/commands/cases/delete.ts`**

```typescript
import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export default class CasesDelete extends BaseCommand {
  static override description = 'Delete a Pega case (V2)';
  static override examples = ['<%= config.bin %> cases delete MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Full case handle' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesDelete);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const path = `/cases/${encodeURIComponent(args.caseId)}`;
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'DELETE',
        url,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      await client.delete(path);
      this.emit({ deleted: true, caseId: args.caseId }, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
```

- [ ] **Step 5: Run tests — expect all green**

Run: `npm test -- test/commands/cases/`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/commands/cases/ test/commands/cases/
git commit -m "Implement cases get/create/delete commands"
```

---

## Task 8: `assignments` command group — get, get-next, perform

**Goal:** Implement the three `pega assignments` commands. `perform` auto-fetches eTag via a preliminary GET.

**Files:**
- Create: `src/commands/assignments/get.ts`
- Create: `src/commands/assignments/get-next.ts`
- Create: `src/commands/assignments/perform.ts`
- Test: `test/commands/assignments/get.test.ts`
- Test: `test/commands/assignments/get-next.test.ts`
- Test: `test/commands/assignments/perform.test.ts`

**Acceptance Criteria:**
- [ ] `pega assignments get <id>` calls GET `/assignments/{encodedId}`.
- [ ] `pega assignments get-next` calls GET `/assignments/next`; 404 → `{ assignment: null }`; exit 0.
- [ ] `pega assignments perform <id> --action X`:
  - [ ] First GETs `/assignments/{id}` to capture `ETag` header.
  - [ ] Then PATCHes `/assignments/{id}/actions/{action}` with `If-Match: <eTag>`.
  - [ ] Includes `{ content: ... }` in body when `--data` provided.
- [ ] `--dry-run` on `perform` prints the PATCH request (skips the preliminary GET — nothing has happened yet).

**Verify:** `npm test -- test/commands/assignments/` → all green

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `test/commands/assignments/get.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AssignmentsGet } = await import('../../../src/commands/assignments/get.js');

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('assignments get', () => {
  test('emits assignment JSON on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1', status: 'Open' });

    captured = captureOutput();
    await AssignmentsGet.run(['A-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'A-1', status: 'Open' });
  });

  test('--dry-run prints GET request without network', async () => {
    captured = captureOutput();
    await AssignmentsGet.run(['A-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toContain('/assignments/A-1');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });
});
```

Create `test/commands/assignments/get-next.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AssignmentsGetNext } = await import(
  '../../../src/commands/assignments/get-next.js'
);

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('assignments get-next', () => {
  test('emits assignment JSON on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/next')
      .reply(200, { id: 'A-42' });

    captured = captureOutput();
    await AssignmentsGetNext.run([]);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'A-42' });
  });

  test('emits { assignment: null } on 404 and exits 0', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/next')
      .reply(404, { localizedValue: 'No assignments' });

    captured = captureOutput();
    await AssignmentsGetNext.run([]);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ assignment: null });
  });

  test('--dry-run prints GET /assignments/next without network', async () => {
    captured = captureOutput();
    await AssignmentsGetNext.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toContain('/assignments/next');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });
});
```

Create `test/commands/assignments/perform.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AssignmentsPerform } = await import(
  '../../../src/commands/assignments/perform.js'
);

let captured: CapturedOutput;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
});

describe('assignments perform', () => {
  test('GETs assignment first for eTag, then PATCHes with If-Match', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1' }, { ETag: '"etag-xyz"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/assignments/A-1/actions/Submit', {
        content: { field: 'value' },
      })
      .matchHeader('If-Match', '"etag-xyz"')
      .reply(200, { ok: true });

    captured = captureOutput();
    await AssignmentsPerform.run(['A-1', '--action', 'Submit', '--data', '{"field":"value"}']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ok: true });
  });

  test('--dry-run prints PATCH request without any network calls', async () => {
    captured = captureOutput();
    await AssignmentsPerform.run([
      'A-1',
      '--action',
      'Submit',
      '--data',
      '{"k":"v"}',
      '--dry-run',
    ]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/assignments/A-1/actions/Submit',
    );
    expect(out.body).toEqual({ content: { k: 'v' } });
  });

  test('no --data sends empty body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1' }, { ETag: '"tag"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/assignments/A-1/actions/Submit', {})
      .reply(200, { ok: true });

    captured = captureOutput();
    await AssignmentsPerform.run(['A-1', '--action', 'Submit']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Implement `src/commands/assignments/get.ts`**

```typescript
import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export default class AssignmentsGet extends BaseCommand {
  static override description = 'Get a Pega assignment by ID';
  static override examples = ['<%= config.bin %> assignments get ASSIGN-WORKLIST X-1!FLOW'];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Full assignment handle' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsGet);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const path = `/assignments/${encodeURIComponent(args.assignmentId)}`;
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'GET',
        url,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      const result = await client.get(path);
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
```

- [ ] **Step 3: Implement `src/commands/assignments/get-next.ts`**

```typescript
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { isNormalizedError } from '../../lib/errors.js';

export default class AssignmentsGetNext extends BaseCommand {
  static override description = 'Get the next assignment from the worklist';
  static override examples = ['<%= config.bin %> assignments get-next'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AssignmentsGetNext);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2/assignments/next`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'GET',
        url,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      const result = await client.get('/assignments/next');
      this.emit(result, baseFlags);
    } catch (err) {
      if (isNormalizedError(err) && err.code === 'NOT_FOUND') {
        this.emit({ assignment: null }, baseFlags);
        return;
      }
      this.fail(err);
    }
  }
}
```

- [ ] **Step 4: Implement `src/commands/assignments/perform.ts`**

```typescript
import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { readDataFlag } from '../../lib/input.js';

export default class AssignmentsPerform extends BaseCommand {
  static override description = 'Perform an action on an assignment (PATCH with If-Match eTag)';
  static override examples = [
    '<%= config.bin %> assignments perform ASSIGN-WORKLIST X-1!FLOW --action Submit',
    '<%= config.bin %> assignments perform ASSIGN-WORKLIST X-1!FLOW --action Submit --data @form.json',
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Full assignment handle' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Flow action ID (e.g., Submit)' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsPerform);
    const baseFlags = flags as unknown as BaseFlags;

    let content: unknown;
    if (flags.data) {
      try {
        content = await readDataFlag(flags.data);
      } catch (err) {
        this.fail(err);
      }
    }

    const body: Record<string, unknown> = {};
    if (content !== undefined) body.content = content;

    const cfg = getConfig(baseFlags.profile);
    const encId = encodeURIComponent(args.assignmentId);
    const encAction = encodeURIComponent(flags.action);
    const path = `/assignments/${encId}/actions/${encAction}`;
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'PATCH',
        url,
        headers: {
          Authorization: 'Bearer <token>',
          'Content-Type': 'application/json',
          'If-Match': '<etag-from-GET>',
          'x-origin-channel': 'Web',
        },
        body,
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      // Fetch eTag first — Pega requires If-Match on the PATCH.
      const meta = await client.getWithMeta(`/assignments/${encId}`);
      const eTag = meta.eTag;
      if (!eTag) {
        this.fail({
          code: 'MISSING_ETAG',
          message: 'Assignment response did not include an ETag header',
          httpStatus: meta.status,
        });
      }
      const result = await client.patch(path, body, {
        extraHeaders: { 'If-Match': eTag! },
      });
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
```

- [ ] **Step 5: Run tests — expect all green**

Run: `npm test -- test/commands/assignments/`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/commands/assignments/ test/commands/assignments/
git commit -m "Implement assignments get/get-next/perform with eTag auto-fetch"
```

---

## Task 9: README, `.env.example` verification, manifest

**Goal:** Produce a complete README meeting phase-1.md's requirements, regenerate the oclif manifest, and do a CI-friendly green-check of the full test suite.

**Files:**
- Create: `README.md`

**Acceptance Criteria:**
- [ ] README has all 7 required sections: Installation, Configuration, Quick Start, Command Reference table, Global Flags table, CI/CD usage, Troubleshooting.
- [ ] `npm run prepack` regenerates `oclif.manifest.json` without error.
- [ ] `npm test` runs every test file, zero failures.
- [ ] `npm run lint` exits 0.
- [ ] `./bin/run.js --help` shows `auth`, `cases`, `assignments` topics.
- [ ] `PEGA_NO_CACHE=true PEGA_BASE_URL=... PEGA_CLIENT_ID=... PEGA_CLIENT_SECRET=... ./bin/run.js auth login --dry-run` exits 0 without touching the filesystem (verify `~/.pega-cli/token.json` does not exist after the run).

**Verify:** `npm test && npm run lint && npm run prepack` → all exit 0

**Steps:**

- [ ] **Step 1: Write `README.md`**

```markdown
# @pknoetze/pega-dx-cli

A developer-first command-line interface for the Pega Infinity™ DX API V2 (Constellation DX API), designed for both humans at the terminal and LLM coding agents.

## Installation

```bash
npm install -g @pknoetze/pega-dx-cli
```

This installs the `pega` binary. Requires Node.js 22 or newer.

## Configuration

Configuration is read from environment variables first, falling back to `~/.pega-cli/config.json`. Credentials are never accepted as CLI flags.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PEGA_BASE_URL` | yes | Your Pega instance root URL (no `/prweb`) |
| `PEGA_CLIENT_ID` | yes | OAuth 2.1 client credentials — client ID |
| `PEGA_CLIENT_SECRET` | yes | OAuth 2.1 client credentials — client secret |
| `PEGA_NO_CACHE` | no | Set to `true` to disable token file caching (CI/CD) |

### Config file

`~/.pega-cli/config.json`:

```json
{
  "profiles": {
    "default": {
      "baseUrl": "https://your-instance.pega.com",
      "clientId": "...",
      "clientSecret": "..."
    }
  }
}
```

Switch profiles with `--profile <name>`.

## Quick start

```bash
export PEGA_BASE_URL=https://your-instance.pega.com
export PEGA_CLIENT_ID=your-client-id
export PEGA_CLIENT_SECRET=your-client-secret

pega auth login
pega auth ping
pega cases get MYAPP-CASE-1
```

## Command reference

| Command | Description | Example |
|---|---|---|
| `pega auth login` | Acquire a fresh OAuth token, cache it | `pega auth login` |
| `pega auth ping` | Report connectivity and response time | `pega auth ping` |
| `pega auth diagnose` | Run 4-step config/connectivity diagnostic | `pega auth diagnose` |
| `pega cases get <caseId>` | Fetch a case by ID | `pega cases get MYAPP-CASE-1 --fields status` |
| `pega cases create --type <id>` | Create a new case | `pega cases create --type Claim --data @claim.json` |
| `pega cases delete <caseId>` | Delete a case (must be in create stage) | `pega cases delete MYAPP-CASE-1` |
| `pega assignments get <id>` | Fetch an assignment | `pega assignments get ASSIGN-WORKLIST X-1!FLOW` |
| `pega assignments get-next` | Get next assignment from worklist | `pega assignments get-next` |
| `pega assignments perform <id> --action <id>` | Perform assignment action (auto-fetches eTag) | `pega assignments perform X-1 --action Submit --data @form.json` |

## Global flags

Every command accepts these:

| Flag | Default | Description |
|---|---|---|
| `--format` | `json` | Output format: `json` or `compact` |
| `--fields` | — | Comma-separated top-level fields to include |
| `--dry-run` | `false` | Print HTTP request (redacted) and exit 0 |
| `--quiet` | `false` | Suppress stderr progress/warning output (structured errors still emit) |
| `--verbose` | `false` | Emit HTTP request/response summaries to stderr |
| `--no-cache` | `false` | Bypass token cache; perform fresh OAuth exchange |
| `--profile` | `default` | Named config profile |

### `--data` input forms

`--data` accepts three forms for JSON payloads:

- Inline: `--data '{"key":"value"}'`
- File: `--data @path/to/file.json`
- Stdin: `--data -` (pipe JSON via stdin)

## Exit codes

- `0` — success (including `auth diagnose` with failed checks and `ping` with unreachable server — the command succeeded at reporting status)
- `1` — API/runtime error (network, auth failure, 4xx/5xx)
- `2` — invalid arguments or missing configuration

## CI/CD usage

In CI environments, bypass the token cache entirely:

```bash
export PEGA_NO_CACHE=true
export PEGA_BASE_URL=https://your-instance.pega.com
export PEGA_CLIENT_ID=${{ secrets.PEGA_CLIENT_ID }}
export PEGA_CLIENT_SECRET=${{ secrets.PEGA_CLIENT_SECRET }}
pega cases get MYAPP-CASE-1 | jq '.status'
```

With `PEGA_NO_CACHE=true`, the CLI never reads or writes `~/.pega-cli/token.json`. Every invocation performs a fresh OAuth exchange.

## Troubleshooting

Run `pega auth diagnose` to identify where the problem is:

| Failing check | Fix |
|---|---|
| `baseUrl` | Set `PEGA_BASE_URL` (without `/prweb`) in your environment or config file |
| `credentials` | Set `PEGA_CLIENT_ID` and `PEGA_CLIENT_SECRET` |
| `oauth` | Verify client credentials in Pega Infinity admin; check that the OAuth 2.0 service rule is enabled |
| `apiV2` | Confirm your instance has the Constellation DX API (V2) enabled; check network reachability |

### Common errors

- `UNAUTHORIZED (401)` — credentials invalid or token expired. Run `pega auth login`.
- `NOT_FOUND (404)` — the case or assignment ID does not exist. Check the full handle.
- `PRECONDITION_FAILED (412)` — eTag mismatch on `assignments perform`. The assignment changed between the eTag fetch and the PATCH; retry the command.
- `VALIDATION_FAIL (422)` — Pega rejected the payload. Inspect `--data` contents.
- `RATE_LIMITED (429)` — Pega is throttling; back off and retry.

## Architecture and scope

This CLI implements Phase 1 of `@pknoetze/pega-dx-cli`. Phase 2 adds the remaining Pega tool categories (attachments, data views, case types, participants, followers, related cases, tags, documents), a `table` output format, and an `--interactive` wizard mode for assignment flows. Phase 3 delivers standalone binaries and shell completions.

The API V2 client is ported from the [pega-dx-mcp](https://github.com/marco-looy/pega-dx-mcp) MCP server. Only Constellation DX API (V2) is supported; V1 is out of scope.
```

- [ ] **Step 2: Regenerate manifest and run full suite**

Run:
```bash
npm run prepack
npm test
npm run lint
./bin/run.js --help
./bin/run.js auth login --help
./bin/run.js cases get --help
./bin/run.js assignments perform --help
```

Expected: all exit 0; help outputs show descriptions, flags, and examples.

- [ ] **Step 3: Smoke-test --no-cache behavior**

Run:
```bash
rm -rf ~/.pega-cli
PEGA_BASE_URL=https://test PEGA_CLIENT_ID=x PEGA_CLIENT_SECRET=y PEGA_NO_CACHE=true ./bin/run.js auth login --dry-run
ls -la ~/.pega-cli 2>/dev/null && echo "FAIL: ~/.pega-cli should not exist" || echo "OK: no ~/.pega-cli written"
```
Expected: "OK: no ~/.pega-cli written".

- [ ] **Step 4: Commit**

```bash
git add README.md oclif.manifest.json
git commit -m "Add README with phase-1 command/flag reference and troubleshooting"
```

---

## Task 10: User verification against real Pega instance

**Goal:** Confirm Phase 1's Definition of Done works end-to-end against a real Pega Infinity instance. Phase-1.md requires this — it cannot be verified automatically.

**User Verification Required:**
Before marking this task complete, you MUST call AskUserQuestion:

```yaml
AskUserQuestion:
  question: "Have you run the Phase 1 Definition of Done checklist against your real Pega Infinity instance, and does everything pass? Specifically: (1) `pega auth login` authenticates, (2) `pega auth diagnose` reports overall:pass, (3) `pega cases create --type <real-type> --data @file.json` creates a case, (4) `pega assignments perform <real-id> --action <real-action>` works, (5) `PEGA_NO_CACHE=true pega auth login` leaves ~/.pega-cli/token.json untouched."
  header: "DoD Verify"
  options:
    - label: "All pass against real Pega"
      description: "All 5 checks pass against a real Pega instance — Phase 1 is done"
    - label: "Something failed — needs rework"
      description: "One or more checks failed; file an issue or iterate on the plan"
```

**If the user selects the negative option:** The task is NOT complete. Investigate the failure with the user, determine which component needs rework, and iterate. Re-run `pega auth diagnose` first to narrow down whether it's config, auth, or API layer. Then re-verify with AskUserQuestion.

**Steps:**

- [ ] **Step 1: Run local install and give the user the exact command sequence**

Run locally:
```bash
npm install -g .
which pega
pega --version
```

Tell the user:

> Please run the following against your real Pega instance and report the result:
>
> ```bash
> export PEGA_BASE_URL=<your-instance>
> export PEGA_CLIENT_ID=<your-client-id>
> export PEGA_CLIENT_SECRET=<your-client-secret>
>
> # 1. Auth
> pega auth login
> # Expected: { "authenticated": true, "expiresAt": "..." }
>
> # 2. Diagnose
> pega auth diagnose
> # Expected: { "checks": [...], "overall": "pass" }
>
> # 3. Case create — replace <type> and file contents for your app
> echo '{"SomeField": "value"}' > /tmp/case.json
> pega cases create --type <your-case-type> --data @/tmp/case.json
>
> # 4. Get and delete the created case
> pega cases get <returned-case-id>
> pega cases delete <returned-case-id>
>
> # 5. Assignment perform — use a real assignment ID from your worklist
> pega assignments get-next
> pega assignments perform <assignment-id> --action <action-id>
>
> # 6. CI-safe mode
> rm ~/.pega-cli/token.json
> PEGA_NO_CACHE=true pega auth login
> test -f ~/.pega-cli/token.json && echo "FAIL: token file written" || echo "OK: no token written"
> ```

- [ ] **Step 2: Ask the verification question via AskUserQuestion**

- [ ] **Step 3: If user reports failure, iterate**

Diagnose specific failure, update code/tests, recommit, re-verify.

- [ ] **Step 4: On success, announce Phase 1 complete**

Report:
> Phase 1 Definition of Done checklist:
> - [x] `npm install -g .` produces working `pega` binary
> - [x] All `--help` outputs present
> - [x] `auth diagnose` identifies valid/invalid config
> - [x] `cases get <id> --dry-run` redacts auth header and exits 0
> - [x] `cases create --type X --data @file.json` works end-to-end
> - [x] `assignments perform <id> --action Y` works end-to-end
> - [x] `PEGA_NO_CACHE=true pega auth login` no filesystem writes
> - [x] `npm test` passes
> - [x] README complete
>
> Phase 1 complete. Do not start Phase 2 unless the user explicitly asks.

```json:metadata
{"files": [], "verifyCommand": "", "acceptanceCriteria": ["user confirms Phase 1 DoD passes against real Pega instance"], "requiresUserVerification": true, "userVerificationPrompt": "Have you run the Phase 1 Definition of Done checklist against your real Pega Infinity instance, and does everything pass?"}
```

---

## Plan summary

| Task | Component | Files | User verify |
|---|---|---|---|
| 0 | Scaffolding | package.json, tsconfig, jest, eslint, bin/run.js | No |
| 1 | `errors.ts` | src/lib/errors.ts + test | No |
| 2 | `output.ts` | src/lib/output.ts + helper + test | No |
| 3 | `config.ts` | src/lib/config.ts + helpers + test | No |
| 4 | `api-client.ts` | src/lib/api-client.ts + test | No |
| 5 | `base-command.ts` + input helper | src/base-command.ts, src/lib/input.ts + tests | No |
| 6 | `auth` commands | src/commands/auth/* + tests | No |
| 7 | `cases` commands | src/commands/cases/* + tests | No |
| 8 | `assignments` commands | src/commands/assignments/* + tests | No |
| 9 | README + manifest | README.md, oclif.manifest.json | No |
| 10 | Real-Pega DoD verification | none (user runs manually) | **Yes** |

## Conventions reminder

- **Red → green → refactor** inside each task. Do not skip the failing-test step.
- **Commit after every task.** Frequent commits make the plan reversible.
- **stdout stays sacred** — if a test shows unexpected bytes in stdout, stop and investigate.
- **Every `--dry-run` path must skip all network calls.** If a test mock is triggered during a `--dry-run` test, that's a bug.
- **Never expand scope.** If a command needs something beyond phase-1.md (e.g., a new flag), stop and ask.
