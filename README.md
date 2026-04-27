# pega-dx-cli

A developer-first command-line interface for the Pega Infinity™ DX API V2 (Constellation DX API), designed for both humans at the terminal and LLM coding agents.

## Installation

```bash
npm install -g pega-dx-cli
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

After creating `~/.pega-cli/config.json`, set restrictive permissions: `chmod 0600 ~/.pega-cli/config.json`. The file contains your OAuth client secret.

## Profiles

Use `--profile <name>` to switch between Pega environments. The CLI looks up the named block in `~/.pega-cli/config.json`. Environment variables (`PEGA_BASE_URL`, `PEGA_CLIENT_ID`, `PEGA_CLIENT_SECRET`) still take precedence over file config.

```bash
# Authenticate the staging profile
pega auth login --profile staging

# Run a command against staging
pega cases get CASE-123 --profile staging
```

The token cache is namespaced per profile: `~/.pega-cli/token.default.json`, `~/.pega-cli/token.staging.json`, etc. Each file is created with mode `0600` on Unix.

If you have a legacy `~/.pega-cli/token.json` from before Phase 2a, it is ignored by the CLI and safe to delete.

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
| `--format` | `json` | Output format: `json`, `compact`, `yaml`, or `table` |
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

## Output formats

| `--format` | Description |
|---|---|
| `json` (default) | Pretty-printed JSON |
| `compact` | Minified JSON, one line |
| `yaml` | YAML, useful for diffs and human reading |
| `table` | Human-readable table; falls back to JSON for shapes that can't be tabulated |

```bash
# JSON (default)
pega cases get CASE-123

# Compact JSON for piping
pega cases get CASE-123 --format compact | jq '.id'

# YAML for human reading
pega cases get CASE-123 --format yaml

# Table for terminal browsing
pega cases get CASE-123 --format table
```

`--fields <a,b,c>` filters top-level keys before serialization and works with all four formats.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | API or runtime error (network, timeout, 4xx/5xx, etc.) |
| 2 | Invalid arguments or configuration (`INVALID_CONFIG`, `INVALID_ARGS`, oclif parse failure) |

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

This CLI implements Phase 1 of `pega-dx-cli`. Phase 2 adds the remaining Pega tool categories (attachments, data views, case types, participants, followers, related cases, tags, documents), a `table` output format, and an `--interactive` wizard mode for assignment flows. Phase 3 delivers standalone binaries and shell completions.

The API V2 client is ported from the [pega-dx-mcp](https://github.com/marco-looy/pega-dx-mcp) MCP server. Only Constellation DX API (V2) is supported; V1 is out of scope.
