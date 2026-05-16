---
name: pega-dx
description: |
  Use whenever the user asks about Pega Infinity DX API v2 (Constellation),
  Pega cases, assignments, case types, Pega Pulse, Pega AI agents/assistants,
  Pega data views, or mentions "Pega" alongside an API/automation task —
  even when they don't explicitly name the CLI. This skill teaches you to
  use the `pega` CLI (pega-dx-cli) to authenticate, fetch and mutate cases
  and assignments, manage attachments, query data views, and chat with
  Pega's conversational AI surface. Always use the CLI as the interface
  rather than calling /prweb/api/application/v2 endpoints directly.
version: 1.0.0
---

# Pega DX CLI skill

You are working with `pega-dx-cli` — a command-line interface for Pega
Infinity's Constellation DX API v2. Treat the `pega` binary as the only
sanctioned surface for talking to a Pega instance. Do not curl
`/prweb/api/application/v2/...` directly; the CLI handles OAuth, token
caching, eTag fetching, redaction, retries, and output shaping for you.

## 1. Preflight

Before doing anything else, confirm the binary is on PATH:

```bash
pega --version
```

If the command is not found, stop and tell the user to install the CLI
from https://pknoetze.github.io/pega-dx-cli/install. Do not try to
reimplement Pega calls with `curl`, `httpie`, or a language SDK as a
workaround — get the CLI installed first.

## 2. The contract

Every `pega` command follows the same I/O contract:

- **stdout** is structured data — JSON by default. Safe to pipe into `jq`,
  redirect to a file, or feed into another tool.
- **stderr** is human progress, warnings, and prompts. Use `--quiet` to
  silence it in scripts; structured errors still emit on stderr.
- **exit code** signals success (`0`), API/runtime error (`1`), or
  invalid args/config (`2`). `130` means the user hit Ctrl+C in an
  interactive prompt.

Seven global flags are accepted by every command:

- `--format <json|compact|yaml|table>` — output shape. Example:
  `pega cases get CASE-1 --format yaml`.
- `--fields <a,b,c>` — keep only the named top-level keys. Example:
  `pega cases get CASE-1 --fields id,status`.
- `--dry-run` — print the (redacted) HTTP request and exit 0. Example:
  `pega cases create --type Claim --data @c.json --dry-run`.
- `--quiet` — suppress stderr progress. Example:
  `pega auth ping --quiet`.
- `--verbose` — emit request/response summaries to stderr. Example:
  `pega cases get CASE-1 --verbose`.
- `--no-cache` — bypass the token cache and perform a fresh OAuth
  exchange. Example: `pega auth login --no-cache`.
- `--profile <name>` — pick a named block from `~/.pega-cli/config.json`.
  Example: `pega cases get CASE-1 --profile staging`.

## 3. Auth & environment

Configuration precedence is **environment variables → config file**.
Three env vars are required (`PEGA_BASE_URL`, `PEGA_CLIENT_ID`,
`PEGA_CLIENT_SECRET`); a fourth (`PEGA_NO_CACHE=true`) disables the token
cache for CI. The config file lives at `~/.pega-cli/config.json` and
holds one block per profile (`default`, `staging`, etc.).

Credentials are **never** accepted as CLI flags — neither client secret
nor OAuth token. Do not invent flags like `--client-secret`. They do not
exist by design.

Workflow per session:

```bash
pega auth login            # acquire a fresh token, cache it (0600)
pega auth ping             # confirm connectivity + measure latency
pega auth diagnose         # 4-step config/connectivity probe when things break
```

Token caches are per-profile (`~/.pega-cli/token.default.json`,
`~/.pega-cli/token.staging.json`) and created with mode `0600` on Unix.
A legacy `~/.pega-cli/token.json` from earlier versions is ignored.

## 4. The Pega DX mental model

You will save yourself hours by internalising these distinctions early.

**Case.** A long-lived business work object identified by a handle like
`MYAPP-WORK-CLAIM C-1234` (often shortened to `MYAPP-CASE-1`). Cases
have a *type* (the rule defining their lifecycle), a *stage* (where they
are in the flow), and a *content page* (`data.caseInfo.content`) full of
fields. You read a case with `pega cases get`; you mutate one by
*performing an action* on it or its assignment.

**Assignment.** A single step a user (or service) must perform to move
the case forward. Assignment IDs look like `ASSIGN-WORKLIST X-1!FLOW` —
the `!FLOW` suffix is the flow name. Multiple assignments can be open
against the same case. You fetch one with `pega assignments get`, fetch
its form view with `pega assignments get-action`, and submit it with
`pega assignments perform`.

**Action.** A named transition. An action is bound either to a case
(`cases perform-action`) or to an assignment (`assignments perform`).
Each action has a *view* — the form Pega would render for it in
Constellation — which tells you which fields are required, their types,
and their allowed values. Always fetch the action's view first
(`cases get-action` or `assignments get-action`) before composing a
`--data` payload; do not guess field names.

**View.** A read-only projection of the case (or an action's form),
defined as a rule in Pega. Use `pega cases get-view <caseId> --view
Summary` to fetch one; `pega cases refresh-view` re-evaluates calculated
fields without mutating the case.

**Stage.** A coarse-grained phase of a case's lifecycle (e.g. `Intake`,
`Review`, `Resolution`). Advance with `pega cases stage-next`, jump
explicitly with `pega cases stage-go --stage Resolution`. Stages are
also returned by `pega cases list-stages`.

**eTags & PATCH semantics.** Every mutation that updates an existing
case, assignment, or savable data record is a PATCH that requires an
`If-Match` eTag. The CLI fetches and supplies this eTag automatically
for `assignments perform`, `data update`, and `data patch`. If the case
changed between the eTag fetch and the PATCH you get HTTP 412
(`PRECONDITION_FAILED`) — the fix is to re-run the command, not to
override.

**Page-instructions.** Pega's wire format for editing list/group fields
inside the case's content page. They live alongside `--data` on
mutation commands (`--page-instructions`) and let you append, insert,
update, or delete elements without rewriting the whole list. See
`references/concepts.md` for shapes.

**Content pages.** Pega groups fields into *pages*. The top-level case
content lives at `data.caseInfo.content.*`; embedded pages (like
`.Customer.*`) are accessed by drilling into that same shape. There is
no separate `cases get-page` command — embedded pages are returned by
`pega cases get` under `data.caseInfo.content`.

**Out of scope.** Only the Constellation DX API (V2) is supported. The
legacy V1 API (Application Endpoints) is not exposed by this CLI; if
the user asks for V1 endpoints, tell them this CLI does not cover that
surface.

## 5. Routing — pick the right reference

The skill ships six reference files. Read them on demand, not up front.

- Cases, assignments, case-types work → read references/case-lifecycle.md
- Data views, queries, savable records → read references/data-views.md
- File/URL attachments, documents → read references/attachments-and-documents.md
- ai-agents or assistants conversations → read references/conversational-ai.md
- Tags/followers/related/participants/social/recents/ui-lists → read references/social-and-collab.md
- Auth, profiles, eTag, page-instructions, output formats, exit codes → read references/concepts.md
- Need a flag-level lookup for any command → read references/command-catalog.md

## 6. Recipes

### Recipe 1 — Fetch a case, list attachments, download one

```bash
pega cases get MYAPP-CASE-1 --fields id,status > case.json
pega attachments list MYAPP-CASE-1 --format compact > atts.json
ATTACH_ID=$(jq -r '.[0].ID' atts.json)
pega attachments get "$ATTACH_ID" --output /tmp/first-attachment.bin
ls -la /tmp/first-attachment.bin
# stdout from `attachments get --output` is {path, bytes, type}
```

### Recipe 2 — Discover creation fields, then create the case

```bash
# Step 1: ask Pega what fields the create action requires
pega case-types get-action Uplus-FS-Work-ProductComplaint \
  --action pyStartCase --format json > start-view.json

# Step 2: hand-author claim.json using the field names from start-view.json
#         (look under .uiResources.resources.views or .data.caseInfo.content)
cat > claim.json <<'JSON'
{"pyCustomerName":"Jane Doe","pyDescription":"Faulty toaster"}
JSON

# Step 3: create the case
pega cases create --type Uplus-FS-Work-ProductComplaint --data @claim.json
```

### Recipe 3 — Walk an assignment two ways

```bash
# Interactive (developer at a TTY): the wizard discovers fields for you
pega assignments perform ASSIGN-WORKLIST X-1!FLOW --interactive

# Non-interactive (CI / scripts): fetch the action view, build a payload, submit
pega assignments get-action ASSIGN-WORKLIST X-1!FLOW \
  --action Submit > submit-view.json
cat > form.json <<'JSON'
{"pyApproved":true,"pyComment":"Looks good"}
JSON
pega assignments perform ASSIGN-WORKLIST X-1!FLOW \
  --action Submit --data @form.json
```

### Recipe 4 — Page a data view

```bash
pega data query D_OrderList \
  --max 50 --page 2 --include-total \
  --params '{"Status":"Open"}' \
  --format compact | jq '{total: .pageInfo.totalRows, rows: .data | length}'
```

The four query commands (`query`, `count`, `query-metadata`, `query-view`)
run with an extended 45-second timeout. `--data` and
`--params`/`--max`/`--page`/`--include-total` are mutually exclusive —
pick the structured-flag form or the raw-body form, not both.

### Recipe 5 — AI agent round-trip

```bash
# List agents and pick one
AGENT=$(pega ai-agents list --format json | jq -r '.[0] | .agentClass + "!" + .name')

# Start a conversation, capture its ID
CONV=$(pega ai-agents start-conversation "$AGENT" \
  --context-id MYORG-WORK\!M-123 \
  --format json | jq -r .ID)

# Send a turn
pega ai-agents send-message "$AGENT" --conversation "$CONV" \
  --request "What is the balance on this case?"

# Close when done so resources are released
pega ai-agents close-conversation "$AGENT" --conversation "$CONV"
```

### Recipe 6 — Bulk discover and bulk perform

```bash
# Step 1: which bulk actions are common across these cases?
pega cases bulk-actions --cases CASE-1,CASE-2 --format json > bulk.json
jq '.actions[] | .ID' bulk.json

# Step 2: perform the chosen action across all of them
pega cases bulk-perform --action Approve \
  --cases CASE-1,CASE-2 \
  --data '{"reason":"Batch approval, ticket #4711"}'
```

## 7. Pitfalls

- **eTag 412 retry.** When `assignments perform`, `data update`, or
  `data patch` returns `PRECONDITION_FAILED (412)`, the case/record was
  changed by someone else between the eTag fetch and your PATCH. Re-run
  the command — the CLI will re-fetch a fresh eTag. Do not try to send
  a stale eTag manually.
- **`data perform-action` view is POST, not GET.** Unlike `cases
  get-action` (GET), the data-record action view is fetched via
  `pega data get-action <id> --action <name>` which issues a POST under
  the hood. The CLI handles this, but expect the verb mismatch if you
  cross-reference the raw API.
- **`participants get/delete/update` need `--participant-id`, not
  `--role`.** Since 0.4.0 the second URL segment is the participant
  instance ID (e.g. `PEGA-PART-123`). Discover IDs with
  `pega participants list` or `pega participants list-roles`.
- **Shell-quote `!` in assignment handles.** Handles like
  `X-1!FLOW` and AI-agent context IDs like `MYORG-WORK!M-123` contain
  `!`, which bash's history expansion will mangle. Either single-quote
  the whole argument (`'X-1!FLOW'`) or escape the bang
  (`MYORG-WORK\!M-123`). Zsh users on the default config don't need
  this, but quoting is safe everywhere.
- **`--data` vs. `--params` in data queries.** On `pega data query` and
  friends, `--data` (raw body) is mutually exclusive with `--params`,
  `--max`, `--page`, and `--include-total`. The CLI rejects the call if
  you combine them.
- **`--interactive` requires both stdin and stdout to be a TTY.** `pega assignments perform
  --interactive` checks `isTTY(stdin) && isTTY(stdout)`. In CI, behind a pipe, or under
  `nohup`, if either stdin or stdout is piped (e.g., `... --interactive | jq`), the flag is ignored with a stderr warning and the command
  falls back to non-interactive mode (which requires `--action` and
  `--data`).

## 8. Where to look next

When the request needs more depth than this file covers, follow the
routing table in section 5. The references hang off this directory:

- `references/concepts.md` — auth/profiles, eTag, page-instructions,
  output formats, exit codes, every global flag.
- `references/case-lifecycle.md` — cases, assignments, case-types.
- `references/data-views.md` — data view queries and savable records.
- `references/attachments-and-documents.md` — file & URL attachments.
- `references/conversational-ai.md` — `ai-agents` and `assistants`.
- `references/social-and-collab.md` — tags, followers, related,
  participants.
- `references/command-catalog.md` — flat command/flag reference.

External sources, in order of preference:

1. **Canonical endpoint reference** —
   https://docs.pega.com/bundle/dx-api/page/platform/dx-api/dx-api-version-2-con.html
2. **Project documentation site** —
   https://pknoetze.github.io/pega-dx-cli/
3. **OpenAPI spec in this repo** — `spec/dx-api.yaml`,
   useful when the CLI doesn't yet surface an endpoint and you need to
   inspect the request/response shape directly.
