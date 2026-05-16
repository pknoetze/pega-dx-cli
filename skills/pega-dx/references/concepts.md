# Pega DX Concepts — When to read this

Read this reference when you need: the OAuth/profile model, eTag rules,
page-instruction shapes, output-format options, exit codes, or any global
flag's behavior. Other references link back here for shared mechanics.

**Authoritative endpoint reference:** https://docs.pega.com/bundle/dx-api/page/platform/dx-api/dx-api-version-2-con.html

## Table of contents

1. OAuth + profiles
2. eTag rules
3. Page-instructions cookbook
4. Output formats
5. Exit codes
6. Global flags reference

## 1. OAuth + profiles

`pega-dx-cli` resolves configuration in a strict precedence order:

1. **Environment variables** — always win.
2. **`~/.pega-cli/config.json` block** — selected by `--profile <name>`
   (defaults to `default`).

If a value is present in both, the env var is used. If a required value
is missing in both, the command exits `2` with `INVALID_CONFIG`.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PEGA_BASE_URL` | yes | Pega instance root URL — no `/prweb` suffix |
| `PEGA_CLIENT_ID` | yes | OAuth 2.1 client-credentials client ID |
| `PEGA_CLIENT_SECRET` | yes | OAuth 2.1 client-credentials client secret |
| `PEGA_NO_CACHE` | no | Set to `true` in CI to disable the token cache |

### Config file shape

`~/.pega-cli/config.json` holds one top-level block per profile:

```json
{
  "default": {
    "baseUrl": "https://your-instance.pega.com",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  },
  "staging": {
    "baseUrl": "https://staging.your-instance.pega.com",
    "clientId": "staging-client-id",
    "clientSecret": "staging-client-secret"
  }
}
```

After creating the file, restrict permissions: `chmod 0600
~/.pega-cli/config.json`. It contains your OAuth client secret.

### Profiles

`--profile <name>` selects the named block. Environment variables still
override file values, so you can keep `default` in your config and
override `PEGA_BASE_URL` per-shell when needed.

```bash
pega auth login --profile staging
pega cases get CASE-1 --profile staging
```

### Per-profile token cache

The OAuth access token is cached on disk so subsequent commands skip the
token exchange. Cache files are namespaced per profile:

- `~/.pega-cli/token.default.json`
- `~/.pega-cli/token.staging.json`
- `~/.pega-cli/token.<profile>.json` — one per profile

Each file is created with mode `0600` on Unix. A legacy
`~/.pega-cli/token.json` from before profile support is ignored and
safe to delete.

Set `PEGA_NO_CACHE=true` (or pass `--no-cache`) to skip the cache
entirely — the CLI performs a fresh OAuth exchange on every command.
This is the right setting for CI/CD pipelines where there is no shared
filesystem and the workload is short-lived.

### Credentials are never CLI flags

There is no `--client-id`, `--client-secret`, or `--token` flag on any
command, by design. Credentials are too sensitive to risk in shell
history, process listings, or CI logs. If the user asks how to pass
secrets on the command line, redirect them to env vars or the config
file.

## 2. eTag rules

Pega DX V2 PATCH operations use HTTP optimistic-concurrency: the server
returns an `ETag` header on GET, the client must echo it as `If-Match`
on the next PATCH. If another writer changed the resource in between,
the PATCH fails with `412 PRECONDITION_FAILED`.

The CLI fetches and forwards eTags automatically for the commands
listed below. You never need to capture or pass an eTag yourself.

| Command | eTag behavior |
|---|---|
| `pega assignments perform` | Fetches eTag automatically before PATCH |
| `pega assignments save` | Fetches eTag automatically before PATCH |
| `pega data update` | Fetches eTag automatically before PATCH |
| `pega data patch` | Fetches eTag automatically before PATCH |
| `pega participants add` | Fetches eTag automatically before PATCH |
| `pega cases perform-action` | Fetches eTag automatically before PATCH |
| `pega cases stage-next` | Fetches eTag automatically before PATCH |
| `pega cases stage-go` | Fetches eTag automatically before PATCH |
| `pega cases recalculate` | Fetches eTag automatically before PATCH |
| `pega attachments patch` | No eTag required (separate resource) |
| `pega cases get` / GET commands | Returns eTag in response metadata |

### 412 retry pattern

When you see `PRECONDITION_FAILED (412)`, the resource changed between
the eTag fetch and the PATCH. The remediation is **re-run the command**.
The CLI will fetch a fresh eTag on the retry.

```bash
pega assignments perform ASSIGN-1 --action Submit --data @form.json
# → PRECONDITION_FAILED (412)
pega assignments perform ASSIGN-1 --action Submit --data @form.json
# → success
```

Do not try to capture the eTag and pass it manually — there is no flag
for that, and it would defeat the point of optimistic concurrency.

## 3. Page-instructions cookbook

`--page-instructions` is Pega's wire format for editing list/group
fields inside the case content page. It is accepted by mutation
commands (`cases perform-action`, `assignments perform`, `data
perform-action`) alongside `--data`.

Each instruction is a JSON object describing one edit. Pass an array of
them inline or via `@file.json`.

### Append a row to a list

```json
[
  {
    "instruction": "APPEND",
    "target": ".Items",
    "content": { "name": "Toaster", "qty": 1, "price": 24.99 }
  }
]
```

### Insert at a specific position

```json
[
  {
    "instruction": "INSERT",
    "target": ".Items",
    "listIndex": 2,
    "content": { "name": "Kettle", "qty": 1, "price": 39.00 }
  }
]
```

### Update an existing row

```json
[
  {
    "instruction": "UPDATE",
    "target": ".Items",
    "listIndex": 1,
    "content": { "qty": 3 }
  }
]
```

### Delete a row

```json
[
  {
    "instruction": "DELETE",
    "target": ".Items",
    "listIndex": 2
  }
]
```

Usage:

```bash
pega assignments perform ASSIGN-1 --action Submit \
  --data '{"pyComment":"Updated cart"}' \
  --page-instructions @cart-edits.json
```

`listIndex` is 1-based. Refer to the action's view (via `get-action`)
to discover which page-list fields exist and their property names.

## 4. Output formats

| `--format` | Output |
|---|---|
| `json` (default) | Pretty-printed JSON, 2-space indent. |
| `compact` | Minified JSON, one line. Ideal for piping to `jq`. |
| `yaml` | YAML rendering of the same shape. Useful for diffs / human reads. |
| `table` | A human-readable ASCII table. Falls back to JSON for non-tabular shapes (e.g. deeply nested case data) — does not error. |

`--fields <a,b,c>` filters the response to the named top-level keys
before serialization. It applies to all four formats:

```bash
pega cases get CASE-1 --fields id,status --format yaml
pega data query D_OrderList --max 10 --fields data --format table
```

When the response shape is "object of objects" or has heterogeneous
keys, `table` silently falls back to JSON output rather than producing
an unreadable table — you get usable output either way.

## 5. Exit codes

The CLI uses a small fixed set of exit codes so scripts can branch on
result without parsing stderr.

| Code | Meaning |
|---|---|
| `0` | Success. Also returned for clean cancellation in interactive mode (user picks "no" at the confirmation prompt). |
| `1` | API or runtime error — HTTP 4xx/5xx, network failure, timeout, JSON parse error from the server, etc. |
| `2` | Invalid arguments or configuration — `INVALID_CONFIG`, `INVALID_ARGS`, oclif parse failure, missing required env var. |
| `130` | User interrupted with Ctrl+C during an interactive prompt. |

There is no `127` for "command not found" — that comes from the shell,
not the CLI. Common HTTP errors map to exit `1` with structured stderr:

- `UNAUTHORIZED (401)` — credentials invalid or token expired; run
  `pega auth login`.
- `NOT_FOUND (404)` — case/assignment/data-view ID does not exist.
- `PRECONDITION_FAILED (412)` — eTag mismatch; retry.
- `VALIDATION_FAIL (422)` — Pega rejected the payload; inspect `--data`.
- `RATE_LIMITED (429)` — back off and retry.

## 6. Global flags reference

These flags are accepted by every command. Defaults are baked into the
CLI; you do not need to specify them unless you want to override.

| Flag | Default | Behavior | Example |
|---|---|---|---|
| `--format` | `json` | Choose the stdout serialization. One of `json`, `compact`, `yaml`, `table`. | `pega cases get CASE-1 --format yaml` |
| `--fields` | — | Comma-separated list of top-level keys to keep before serialization. | `pega cases get CASE-1 --fields id,status` |
| `--dry-run` | `false` | Print the redacted HTTP request to stdout and exit `0` without making the call. Useful for inspecting what would be sent. | `pega cases create --type Claim --data @c.json --dry-run` |
| `--quiet` | `false` | Suppress all stderr progress and warnings. Structured errors still emit. Inquirer prompts in `--interactive` are not suppressed. | `pega auth ping --quiet` |
| `--verbose` | `false` | Emit HTTP request/response summaries (method, URL, status, timing) to stderr. Headers are redacted. | `pega cases get CASE-1 --verbose` |
| `--no-cache` | `false` | Bypass the token cache and perform a fresh OAuth exchange. Equivalent to `PEGA_NO_CACHE=true` for a single invocation. | `pega auth login --no-cache` |
| `--profile` | `default` | Select a named config block. Env vars still take precedence. | `pega cases get CASE-1 --profile staging` |

### `--data` input forms

`--data` accepts three forms for JSON payloads on mutation commands:

- **Inline:** `--data '{"key":"value"}'` — single-quote in bash/zsh to
  avoid shell interpolation.
- **File reference:** `--data @path/to/file.json` — the `@` prefix tells
  the CLI to read the file. Path is relative to the current working
  directory.
- **Stdin:** `--data -` — read the payload from stdin. Useful for
  piping output of one command into another.

```bash
# Inline
pega cases perform-action CASE-1 --action Approve --data '{"reason":"OK"}'

# File
pega cases create --type Claim --data @claim.json

# Stdin
echo '{"reason":"OK"}' | pega cases perform-action CASE-1 --action Approve --data -
```

### Verbose + dry-run together

`--dry-run --verbose` is the most informative combination for debugging
a mutation: verbose dumps the request line and headers, dry-run stops
before the network call so nothing changes server-side.
