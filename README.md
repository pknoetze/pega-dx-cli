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

The CLI is organized into 9 command groups: `auth`, `cases`, `assignments`, `case-types`, `documents`, `tags`, `followers`, `related`, and `participants`.

| Command | Description | Example |
|---|---|---|
| `pega auth login` | Acquire a fresh OAuth token, cache it | `pega auth login` |
| `pega auth ping` | Report connectivity and response time | `pega auth ping` |
| `pega auth diagnose` | Run 4-step config/connectivity diagnostic | `pega auth diagnose` |
| `pega cases get <caseId>` | Fetch a case by ID | `pega cases get MYAPP-CASE-1 --fields status` |
| `pega cases create --type <id>` | Create a new case | `pega cases create --type Claim --data @claim.json` |
| `pega cases delete <caseId>` | Delete a case (must be in create stage) | `pega cases delete MYAPP-CASE-1` |
| `pega cases get-action <caseId>` | Get a case action's view | `pega cases get-action MYAPP-CASE-1 --action Approve` |
| `pega cases perform-action <caseId>` | Perform a case action | `pega cases perform-action MYAPP-CASE-1 --action Approve --data '{"reason":"OK"}'` |
| `pega cases stage-next <caseId>` | Advance to the next stage | `pega cases stage-next MYAPP-CASE-1` |
| `pega cases stage-go <caseId>` | Move to a specific stage | `pega cases stage-go MYAPP-CASE-1 --stage Resolution` |
| `pega cases get-view <caseId>` | Get a named view | `pega cases get-view MYAPP-CASE-1 --view Summary` |
| `pega cases get-page <caseId>` | Get a named embedded page | `pega cases get-page MYAPP-CASE-1 --page Customer` |
| `pega cases list-ancestors <caseId>` | Walk the case hierarchy upward | `pega cases list-ancestors MYAPP-CASE-1` |
| `pega cases list-descendants <caseId>` | Walk the case hierarchy downward | `pega cases list-descendants MYAPP-CASE-1` |
| `pega assignments get <id>` | Fetch an assignment | `pega assignments get ASSIGN-WORKLIST X-1!FLOW` |
| `pega assignments get-next` | Get next assignment from worklist | `pega assignments get-next` |
| `pega assignments perform <id> --action <id>` | Perform assignment action (auto-fetches eTag) | `pega assignments perform X-1 --action Submit --data @form.json` |
| `pega assignments save <id>` | Save a draft of an in-progress assignment | `pega assignments save ASSIGN-1 --action Submit --data @draft.json` |
| `pega assignments navigate-back <id>` | Navigate back to the previous step | `pega assignments navigate-back ASSIGN-1` |
| `pega assignments get-action <id>` | Get the action's view (fields, allowed values) | `pega assignments get-action ASSIGN-1 --action Submit` |
| `pega assignments refresh-action <id>` | Refresh a field after a value change | `pega assignments refresh-action ASSIGN-1 --action Submit --data '{"field":"new"}'` |
| `pega assignments list` | List your worklist | `pega assignments list --max 50` |
| `pega assignments query` | Query a workbasket | `pega assignments query --workbasket WB-1 --max 50` |
| `pega case-types list` | List all case types | `pega case-types list` |
| `pega case-types get <id>` | Get full details of a case type | `pega case-types get MYAPP-WORK-CASE` |
| `pega case-types get-action <id>` | Get the creation action view | `pega case-types get-action MYAPP-WORK-CASE --action pyStartCase` |
| `pega documents list <caseId>` | List documents on a case | `pega documents list MYAPP-CASE-1` |
| `pega documents get <id>` | Get a document's metadata | `pega documents get DOC-1` |
| `pega tags list <caseId>` | List tags on a case | `pega tags list MYAPP-CASE-1` |
| `pega tags add <caseId>` | Add one or more tags | `pega tags add MYAPP-CASE-1 --tag urgent --tag review` |
| `pega tags delete <caseId>` | Remove a tag | `pega tags delete MYAPP-CASE-1 --tag urgent` |
| `pega followers list <caseId>` | List followers on a case | `pega followers list MYAPP-CASE-1` |
| `pega followers add <caseId>` | Add a follower | `pega followers add MYAPP-CASE-1 --user U1` |
| `pega followers delete <caseId>` | Remove a follower | `pega followers delete MYAPP-CASE-1 --user U1` |
| `pega related list <caseId>` | List related cases | `pega related list MYAPP-CASE-1` |
| `pega related add <caseId>` | Add a relationship | `pega related add MYAPP-CASE-1 --related-case-id MYAPP-CASE-2 --relationship parent` |
| `pega related delete <caseId>` | Remove a relationship | `pega related delete MYAPP-CASE-1 --related-case-id MYAPP-CASE-2` |
| `pega participants list <caseId>` | List all participants on a case | `pega participants list MYAPP-CASE-1` |
| `pega participants get <caseId>` | Get one participant | `pega participants get MYAPP-CASE-1 --role Owner` |
| `pega participants add <caseId>` | Add a participant | `pega participants add MYAPP-CASE-1 --role Owner --user U1` |
| `pega participants update <caseId>` | Update a participant's details | `pega participants update MYAPP-CASE-1 --role Owner --data @owner.json` |
| `pega participants replace <caseId>` | Replace all participants in a role | `pega participants replace MYAPP-CASE-1 --role Reviewer --data @reviewers.json` |
| `pega participants delete <caseId>` | Remove a participant | `pega participants delete MYAPP-CASE-1 --role Owner --user U1` |
| `pega participants delete-bulk <caseId>` | Remove all participants in a role | `pega participants delete-bulk MYAPP-CASE-1 --role Reviewer` |

## Cases

Fetch, create, delete, and navigate cases.

```bash
# Fetch a case
pega cases get MYAPP-CASE-1

# Create a case
pega cases create --type Claim --data @claim.json

# Delete a case (must be in create stage)
pega cases delete MYAPP-CASE-1

# Get a case action's view
pega cases get-action MYAPP-CASE-1 --action Approve

# Perform a case action
pega cases perform-action MYAPP-CASE-1 --action Approve --data '{"reason":"OK"}'

# Advance to the next stage
pega cases stage-next MYAPP-CASE-1

# Move to a specific stage
pega cases stage-go MYAPP-CASE-1 --stage Resolution

# Get a named view
pega cases get-view MYAPP-CASE-1 --view Summary

# Get a named embedded page (DEFERRED to Phase 2b.2 — exits NOT_IMPLEMENTED)
pega cases get-page MYAPP-CASE-1 --page Customer

# Walk the case hierarchy
pega cases list-ancestors MYAPP-CASE-1
pega cases list-descendants MYAPP-CASE-1
```

Run `pega cases --help` for the full list of commands and flags.

## Assignments

Fetch and submit assignments from your worklist or a workbasket.

```bash
# Fetch an assignment
pega assignments get ASSIGN-WORKLIST X-1!FLOW

# Get next assignment from worklist
pega assignments get-next

# Perform an assignment action (auto-fetches eTag)
pega assignments perform ASSIGN-1 --action Submit --data @form.json

# Save a draft of an in-progress assignment
pega assignments save ASSIGN-1 --action Submit --data @draft.json

# Navigate back to the previous step
pega assignments navigate-back ASSIGN-1

# Get the action's view (fields, allowed values)
pega assignments get-action ASSIGN-1 --action Submit

# Refresh a field after a value change
pega assignments refresh-action ASSIGN-1 --action Submit --data '{"field":"new"}'

# List your worklist (DEFERRED to Phase 2b.2 — exits NOT_IMPLEMENTED)
pega assignments list --max 50

# Query a workbasket (DEFERRED to Phase 2b.2 — exits NOT_IMPLEMENTED)
pega assignments query --workbasket WB-1 --max 50
```

`assignments list` and `assignments query` are deferred to Phase 2b.2: in Pega DX V2 the worklist and workbaskets are surfaced via data views (e.g. `D_pyMyWorkList`), not via dedicated REST collections. Once `pega data get-view` lands in 2b.2 those data views become accessible.

Run `pega assignments --help` for the full list of commands and flags.

## Case Types

Inspect case types in the application. Useful for discovering creation actions before calling `pega cases create`.

```bash
# List all case types
pega case-types list

# Get full details of a case type (client-side filter on the list response)
pega case-types get Uplus-FS-Work-ProductComplaint

# Get the creation action view (use this to learn what fields create requires)
pega case-types get-action Uplus-FS-Work-ProductComplaint --action Create
```

`case-types get` filters the `case-types list` response client-side because Pega DX V2 has no `GET /casetypes/{id}` endpoint.

Run `pega case-types --help` for the full list.

## Documents

Inspect documents linked to cases.

```bash
# Get a document's metadata (works in 2b.1)
pega documents get DOC-1

# List documents on a case (DEFERRED to Phase 2b.2 — exits NOT_IMPLEMENTED)
pega documents list MYAPP-CASE-1
```

`documents list` is deferred to Phase 2b.2 because in Pega DX V2 documents are surfaced as case attachments rather than via a dedicated `/cases/{id}/documents` endpoint. The forthcoming `attachments` group will cover this.

Run `pega documents --help` for the full list of commands and flags.

## Tags

Manage tags on a case.

```bash
# List tags
pega tags list MYAPP-CASE-1

# Add one or more tags (repeat --tag for multiple)
pega tags add MYAPP-CASE-1 --tag urgent --tag review

# Remove a tag
pega tags delete MYAPP-CASE-1 --tag urgent
```

Run `pega tags --help` for the full list.

## Followers

Manage case followers.

```bash
# List followers
pega followers list MYAPP-CASE-1

# Add a follower
pega followers add MYAPP-CASE-1 --user U1

# Remove a follower
pega followers delete MYAPP-CASE-1 --user U1
```

Run `pega followers --help` for the full list.

## Related

Manage relationships between cases.

```bash
# List related cases
pega related list MYAPP-CASE-1

# Add a relationship
pega related add MYAPP-CASE-1 --related-case-id MYAPP-CASE-2 --relationship parent

# Remove a relationship
pega related delete MYAPP-CASE-1 --related-case-id MYAPP-CASE-2
```

Run `pega related --help` for the full list.

## Participants

Manage case participants by role.

```bash
# List all participants on a case
pega participants list MYAPP-CASE-1

# Get one participant
pega participants get MYAPP-CASE-1 --role Owner

# Add a participant
pega participants add MYAPP-CASE-1 --role Owner --user U1

# Update a participant's details
pega participants update MYAPP-CASE-1 --role Owner --data @owner.json

# Replace all participants in a role
pega participants replace MYAPP-CASE-1 --role Reviewer --data @reviewers.json

# Remove a participant (--role acts as the participant identifier)
pega participants delete MYAPP-CASE-1 --role Owner

# Remove all participants in a role
pega participants delete-bulk MYAPP-CASE-1 --role Reviewer
```

Run `pega participants --help` for the full list.

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
