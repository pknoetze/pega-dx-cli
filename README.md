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

The CLI is organized into 13 command groups: `auth`, `cases`, `assignments`, `case-types`, `documents`, `tags`, `followers`, `related`, `participants`, `attachments`, `data`, `ai-agents`, and `assistants`.

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
| `pega cases list-ancestors <caseId>` | Walk the case hierarchy upward | `pega cases list-ancestors MYAPP-CASE-1` |
| `pega cases list-descendants <caseId>` | Walk the case hierarchy downward | `pega cases list-descendants MYAPP-CASE-1` |
| `pega cases bulk-actions` | List available bulk actions for cases | `pega cases bulk-actions --cases CASE-1,CASE-2` |
| `pega cases bulk-perform` | Perform an action across multiple cases | `pega cases bulk-perform --action Approve --cases CASE-1,CASE-2` |
| `pega cases start-process <caseId>` | Start an optional or stage process | `pega cases start-process MYAPP-CASE-1 --process pyAddNote` |
| `pega cases list-stages <caseId>` | List case stages | `pega cases list-stages MYAPP-CASE-1` |
| `pega cases refresh-action <caseId>` | Refresh a case action's view | `pega cases refresh-action MYAPP-CASE-1 --action Approve` |
| `pega cases recalculate <caseId>` | Recalculate calculated fields | `pega cases recalculate MYAPP-CASE-1 --action Approve --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'` |
| `pega cases refresh-view <caseId>` | Refresh a named view | `pega cases refresh-view MYAPP-CASE-1 --view Summary` |
| `pega cases calc-fields <caseId>` | Compute calculated fields for a view | `pega cases calc-fields MYAPP-CASE-1 --view Summary --data @fields.json` |
| `pega cases discard-updates <caseId>` | Release the case lock | `pega cases discard-updates MYAPP-CASE-1` |
| `pega cases list-attachment-categories <caseId>` | List configured attachment categories | `pega cases list-attachment-categories MYAPP-CASE-1` |
| `pega assignments get <id>` | Fetch an assignment | `pega assignments get ASSIGN-WORKLIST X-1!FLOW` |
| `pega assignments get-next` | Get next assignment from worklist | `pega assignments get-next` |
| `pega assignments perform <id> --action <id>` | Perform assignment action (auto-fetches eTag) | `pega assignments perform X-1 --action Submit --data @form.json` |
| `pega assignments save <id>` | Save a draft of an in-progress assignment | `pega assignments save ASSIGN-1 --action Submit --data @draft.json` |
| `pega assignments navigate-back <id>` | Navigate back to the previous step | `pega assignments navigate-back ASSIGN-1` |
| `pega assignments get-action <id>` | Get the action's view (fields, allowed values) | `pega assignments get-action ASSIGN-1 --action Submit` |
| `pega assignments refresh-action <id>` | Refresh a field after a value change | `pega assignments refresh-action ASSIGN-1 --action Submit --data '{"field":"new"}'` |
| `pega assignments recalculate <id>` | Recalculate calculated fields for an action | `pega assignments recalculate ASSIGN-1 --action Submit --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'` |
| `pega assignments navigate-to-step <id>` | Jump to a specific step | `pega assignments navigate-to-step ASSIGN-1 --step Step3` |
| `pega case-types list` | List all case types | `pega case-types list` |
| `pega case-types get <id>` | Get full details of a case type | `pega case-types get MYAPP-WORK-CASE` |
| `pega case-types get-action <id>` | Get the creation action view | `pega case-types get-action MYAPP-WORK-CASE --action pyStartCase` |
| `pega case-types list-bulk-actions <id>` | List bulk actions for a case type (Launchpad only) | `pega case-types list-bulk-actions Uplus-FS-Work-Loan` |
| `pega documents get <id>` | Get a document's metadata | `pega documents get DOC-1` |
| `pega documents delete <caseId>` | Remove a document linked to a case | `pega documents delete MYAPP-CASE-1 --document DOC-1` |
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
| `pega participants get <caseId>` | Get one participant | `pega participants get MYAPP-CASE-1 --participant-id PEGA-PART-X` |
| `pega participants add <caseId>` | Add a participant | `pega participants add MYAPP-CASE-1 --role Customer --data '{"pyFirstName":"Jane","pyLastName":"Doe","pyEmail1":"jane@example.com","pyPhoneNumber":""}'` |
| `pega participants update <caseId>` | Update a participant's details | `pega participants update MYAPP-CASE-1 --participant-id PEGA-PART-X --data @owner.json` |
| `pega participants delete <caseId>` | Remove a participant | `pega participants delete MYAPP-CASE-1 --participant-id PEGA-PART-X` |
| `pega participants list-roles <caseId>` | List participant roles configured on a case | `pega participants list-roles MYAPP-CASE-1` |
| `pega participants get-role <caseId>` | Get details of a specific participant role | `pega participants get-role MYAPP-CASE-1 --role-id Owner` |
| `pega attachments upload --file <path>` | Upload a file (multipart POST) | `pega attachments upload --file ./invoice.pdf` |
| `pega attachments add <caseId>` | Atomically link attachments to a case | `pega attachments add MYAPP-CASE-1 --attachments '[{"type":"File","ID":"<tmp-id>"}]'` |
| `pega attachments list <caseId>` | List attachments on a case | `pega attachments list MYAPP-CASE-1` |
| `pega attachments get <id>` | Retrieve attachment content or metadata | `pega attachments get ATTACH-1 --output /tmp/x.pdf` |
| `pega attachments delete <id>` | Delete a single attachment | `pega attachments delete ATTACH-1` |
| `pega attachments patch <id>` | Edit attachment name and/or category | `pega attachments patch ATTACH-1 --name "invoice-final.pdf"` |
| `pega data list-objects` | List all data objects | `pega data list-objects` |
| `pega data list-pages` | List all data pages | `pega data list-pages` |
| `pega data get <id>` | Fetch a single data view record | `pega data get D_OrderHeader` |
| `pega data get-metadata <id>` | Get data view metadata | `pega data get-metadata D_OrderList` |
| `pega data query <id>` | POST query against a data view | `pega data query D_OrderList --max 50 --page 2` |
| `pega data count <id>` | Count records in a data view | `pega data count D_OrderList --params '{"Status":"Open"}'` |
| `pega data query-metadata <id>` | POST metadata query against a data view | `pega data query-metadata D_OrderList` |
| `pega data query-view <id>` | POST query against a data view variant | `pega data query-view D_OrderList --view V1 --max 5` |
| `pega data create <id>` | Create a savable data record | `pega data create D_OrderHeader --data '{"orderId":"O-1"}'` |
| `pega data update <id>` | Replace a savable data record (eTag) | `pega data update D_OrderHeader --data @full-record.json` |
| `pega data patch <id>` | Partially update a savable data record (eTag) | `pega data patch D_OrderHeader --data '{"amount":200}'` |
| `pega data delete <id>` | Delete a savable data record | `pega data delete D_OrderHeader` |
| `pega data list-actions <id>` | List actions available on a data record | `pega data list-actions D_OrderHeader` |
| `pega data get-action <id>` | Get a data-record action's view | `pega data get-action D_OrderHeader --action ApproveOrder` |
| `pega data perform-action <id>` | Perform a data-record action | `pega data perform-action D_OrderHeader --action ApproveOrder --data '{"approver":"alice"}'` |
| `pega ai-agents list` | List all AI agents enabled for external access | `pega ai-agents list` |
| `pega ai-agents list-conversations <agentId> --context-id <ctx>` | List conversations for an agent | `pega ai-agents list-conversations MyAgent --context-id MYORG-WORK\!M-123` |
| `pega ai-agents start-conversation <agentId>` | Start a new AI agent conversation | `pega ai-agents start-conversation MyAgent --context-id MYORG-WORK\!M-123` |
| `pega ai-agents get-conversation <agentId> --conversation <id>` | Get details of a single conversation | `pega ai-agents get-conversation MyAgent --conversation PXCONV-1` |
| `pega ai-agents send-message <agentId> --conversation <id> --request <text>` | Send a message in a conversation | `pega ai-agents send-message MyAgent --conversation PXCONV-1 --request "hello"` |
| `pega ai-agents close-conversation <agentId> --conversation <id>` | Close a conversation | `pega ai-agents close-conversation MyAgent --conversation PXCONV-1` |
| `pega ai-agents like <agentId> --conversation <id> --message <msgId>` | Like a message | `pega ai-agents like MyAgent --conversation PXCONV-1 --message MSG-1` |
| `pega ai-agents dislike <agentId> --conversation <id> --message <msgId> --feedback <text>` | Dislike a message with feedback | `pega ai-agents dislike MyAgent --conversation PXCONV-1 --message MSG-1 --feedback "off topic"` |
| `pega assistants list-conversations <assistantId> --context-id <ctx>` | List conversations for an assistant | `pega assistants list-conversations MyAssistant --context-id MYORG-WORK\!M-123` |
| `pega assistants start-conversation <assistantId>` | Start a new assistant conversation | `pega assistants start-conversation MyAssistant --context-id MYORG-WORK\!M-123` |
| `pega assistants get-conversation <assistantId> --conversation <id>` | Get details of a single conversation | `pega assistants get-conversation MyAssistant --conversation PXCONV-1` |
| `pega assistants send-message <assistantId> --conversation <id> --request <text>` | Send a message in a conversation | `pega assistants send-message MyAssistant --conversation PXCONV-1 --request "hello"` |
| `pega assistants close-conversation <assistantId> --conversation <id>` | Close a conversation | `pega assistants close-conversation MyAssistant --conversation PXCONV-1` |

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

# Bulk: list available bulk actions for several cases
pega cases bulk-actions --cases CASE-1,CASE-2,CASE-3

# Bulk: perform an action across multiple cases
pega cases bulk-perform --action Approve --cases CASE-1,CASE-2 --data '{"reason":"OK"}'

# Start an optional or stage process
pega cases start-process MYAPP-CASE-1 --process pyAddNote

# List stages of a case
pega cases list-stages MYAPP-CASE-1

# Refresh a case action's view
pega cases refresh-action MYAPP-CASE-1 --action Approve

# Recalculate calculated fields
pega cases recalculate MYAPP-CASE-1 --action Approve --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'

# Refresh a named view
pega cases refresh-view MYAPP-CASE-1 --view Summary

# Compute calculated fields for a view
pega cases calc-fields MYAPP-CASE-1 --view Summary --data @fields.json

# Release the case lock (discard pending updates)
pega cases discard-updates MYAPP-CASE-1

# List configured attachment categories
pega cases list-attachment-categories MYAPP-CASE-1
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

# Recalculate calculated fields for an assignment action
pega assignments recalculate ASSIGN-1 --action Submit --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'

# Jump to a specific step
pega assignments navigate-to-step ASSIGN-1 --step Step3
```

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

# List bulk actions for a case type (Launchpad only)
pega case-types list-bulk-actions Uplus-FS-Work-Loan
```

`case-types get` filters the `case-types list` response client-side because Pega DX V2 has no `GET /casetypes/{id}` endpoint.

Run `pega case-types --help` for the full list.

## Documents

Inspect and manage documents linked to cases.

```bash
# Get a document's metadata
pega documents get DOC-1

# Remove a document linked to a case
pega documents delete MYAPP-CASE-1 --document DOC-1
```

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

# Get one participant (NEW: --participant-id replaces --role in 0.4.0)
pega participants get MYAPP-CASE-1 --participant-id PEGA-PART-X

# Add a participant
pega participants add MYAPP-CASE-1 --role Customer --data '{"pyFirstName":"Jane","pyLastName":"Doe","pyEmail1":"jane@example.com","pyPhoneNumber":""}'

# Update a participant's details
pega participants update MYAPP-CASE-1 --participant-id PEGA-PART-X --data @owner.json

# Remove a participant
pega participants delete MYAPP-CASE-1 --participant-id PEGA-PART-X

# List participant roles configured on a case
pega participants list-roles MYAPP-CASE-1

# Get details of a specific participant role
pega participants get-role MYAPP-CASE-1 --role-id Owner
```

Run `pega participants --help` for the full list.

## Attachments

The `attachments` group manages file and URL attachments on cases.

```bash
# Upload a file — returns a temporary attachment ID
pega attachments upload --file ./invoice.pdf
# → {"ID":"<temp-uuid>"}

# Append a unique suffix to the filename on the server
pega attachments upload --file ./invoice.pdf --append-unique-id

# Atomically link one or more attachments to a case
pega attachments add MYAPP-CASE-1 --attachments '[
  {"type":"File","category":"File","ID":"<temp-uuid>"},
  {"type":"URL","category":"URL","name":"docs","url":"https://docs.pega.com"}
]'

# List attachments on a case
pega attachments list MYAPP-CASE-1
pega attachments list MYAPP-CASE-1 --include-thumbnails

# Retrieve attachment content (dual-mode)
pega attachments get ATTACH-1                      # raw JSON response
pega attachments get ATTACH-1 --output /tmp/x.pdf  # decoded bytes written to disk; emits {path,bytes,type}

# Delete a single attachment
pega attachments delete ATTACH-1

# Edit attachment name and/or category (no eTag required)
pega attachments patch ATTACH-1 --name "invoice-final.pdf"
pega attachments patch ATTACH-1 --category Receipts
```

`attachments get` assumes the API returns content wrapped in JSON (Base64-encoded for `type=File`, a URL string for `type=URL`, HTML for `type=Correspondence`). With `--output`, the content is decoded and written to disk.

Run `pega attachments --help` for the full list of commands and flags.

## Data

The `data` group covers data objects, data views, savable data record CRUD, and data-record actions. The `<id>` argument is the **data view ID** (e.g. `D_OrderHeader`).

### Catalog

```bash
pega data list-objects   # GET /data_objects
pega data list-pages     # GET /data_pages
```

### Read / Query

```bash
# Fetch a single data view record
pega data get D_OrderHeader

# Get data view metadata (GET)
pega data get-metadata D_OrderList

# POST query — returns rows
pega data query D_OrderList
pega data query D_OrderList --max 50 --page 2 --include-total
pega data query D_OrderList --params '{"FromDate":"2026-01-01"}'
pega data query D_OrderList --data @body.json   # full body escape hatch (mutually exclusive with --params/--max/--page/--include-total)

# Count records
pega data count D_OrderList --params '{"Status":"Open"}'

# POST metadata query
pega data query-metadata D_OrderList

# POST query against a specific data view variant
pega data query-view D_OrderList --view V1 --max 5
```

The four query commands (`query`, `count`, `query-metadata`, `query-view`) use an extended **45-second timeout**. `--data` is mutually exclusive with `--params`/`--max`/`--page`/`--include-total` — pick one form.

### Record CRUD

```bash
# Create a savable data record
pega data create D_OrderHeader --data '{"orderId":"O-1"}'

# Replace a savable data record (eTag auto-fetched)
pega data update D_OrderHeader --data @full-record.json

# Partially update a savable data record (eTag auto-fetched)
pega data patch D_OrderHeader --data '{"amount":200}'

# Delete a savable data record
pega data delete D_OrderHeader
```

`data update` and `data patch` both require an eTag (fetched automatically from the data view before mutation).

### Record Actions

```bash
# List actions available on a data record
pega data list-actions D_OrderHeader

# Get a data-record action's view (POST — unlike cases get-action which is GET)
pega data get-action D_OrderHeader --action ApproveOrder

# Perform a data-record action
pega data perform-action D_OrderHeader --action ApproveOrder --data '{"approver":"alice"}'
```

`data perform-action` accepts the same `--data`/`--page-instructions`/`--attachments` flags as `cases perform-action` and `assignments perform`.

Run `pega data --help` for the full list of commands and flags.

## ai-agents

Conversational AI agents (AgentX). All commands require an authenticated profile.

| Command | Description |
|---|---|
| `ai-agents list` | List all AI agents enabled for external access |
| `ai-agents list-conversations <agentId> --context-id <ctx>` | List conversations for an agent |
| `ai-agents start-conversation <agentId>` | Initiate a new conversation |
| `ai-agents get-conversation <agentId> --conversation <id>` | Get a single conversation |
| `ai-agents send-message <agentId> --conversation <id> --request <text>` | Send a message |
| `ai-agents close-conversation <agentId> --conversation <id>` | Close a conversation |
| `ai-agents like <agentId> --conversation <id> --message <msgId>` | Like a message |
| `ai-agents dislike <agentId> --conversation <id> --message <msgId> --feedback <text>` | Dislike a message |

### Example: full chat round trip

```bash
# Find your agent ID (combine agentClass + "!" + name from the list output)
pega ai-agents list --format json | jq '.[] | .agentClass + "!" + .name'
# e.g. "@baseclass!MyAgent"

# Start a conversation
CONV=$(pega ai-agents start-conversation "@baseclass!MyAgent" --format json | jq -r .ID)

# Send a message
pega ai-agents send-message "@baseclass!MyAgent" --conversation "$CONV" --request "What's my balance?"

# Close when done
pega ai-agents close-conversation "@baseclass!MyAgent" --conversation "$CONV"
```

### Notes

- **Agent ID format:** `pega ai-agents list` returns each agent's `name` and `agentClass` fields. The `<agentId>` argument for conversation commands is `{agentClass}!{name}` — e.g. if `list` shows `"agentClass": "@baseclass"` and `"name": "MyAgent"`, use `@baseclass!MyAgent`. Shell-quoting the `@` is not required but safe.
- Field-name casing: API body uses `Request` (capital R) and `Attachments` (capital A) — the CLI shapes these for you from `--request` / `--attachments`.
- `--attachments` follows the YAML element shape: `[{type, ID, category, name, attachmentFieldName, delete, pyRouteToWorkbasket}, ...]`.

Run `pega ai-agents --help` for the full list of commands and flags.

## assistants

GenAI assistants. Smaller surface than `ai-agents` — no `activeChannel*` fields on start, no `Attachments` on send-message.

| Command | Description |
|---|---|
| `assistants list-conversations <assistantId> --context-id <ctx>` | List conversations for an assistant |
| `assistants start-conversation <assistantId>` | Initiate a new conversation |
| `assistants get-conversation <assistantId> --conversation <id>` | Get a single conversation |
| `assistants send-message <assistantId> --conversation <id> --request <text>` | Send a message |
| `assistants close-conversation <assistantId> --conversation <id>` | Close a conversation |

### Example

```bash
CONV=$(pega assistants start-conversation MyAssistant --context-id MYORG-WORK\!M-123 --format json | jq -r .ID)
pega assistants send-message MyAssistant --conversation "$CONV" --request "Hello"
pega assistants close-conversation MyAssistant --conversation "$CONV"
```

Run `pega assistants --help` for the full list of commands and flags.

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

## Breaking changes in 0.4.0

`pega-dx-cli` 0.4.0 brings the CLI into faithful alignment with the official Pega DX V2 endpoint reference. The following changes are breaking:

- `participants get`, `participants delete`, `participants update` now use `--participant-id` instead of `--role`. The second URL segment is the participant's instance ID (e.g. `PEGA-PART-123`), not the role name. Use `pega participants list` (or the new `pega participants list-roles`) to discover IDs.
- `participants add` now uses `--data` (content page JSON) instead of `--user`, and requires an eTag (fetched automatically). Pass person fields: `{"pyFirstName":"Jane","pyLastName":"Doe","pyEmail1":"jane@example.com","pyPhoneNumber":""}`. The `--role` flag is retained but maps to `participantRoleID` in the request body.
- `cases recalculate` and `assignments recalculate` now require `--data` with a `{calculations:{fields:[...]}}` body. The previous mutation-body flags (`--page-instructions`, `--interest-page`, etc.) are removed.
- `participants replace` and `participants delete-bulk` are removed. Their endpoints are not in the official Pega DX V2 docs and were inferred from the MCP source in 2b.1.
- 4 NOT_IMPLEMENTED stubs from 2b.1 are removed: `documents list`, `assignments list`, `assignments query`, `cases get-page`. The first three find their replacements in upcoming `attachments` and `data-views` groups (Phase 2c.1); embedded pages are returned by `pega cases get` under `data.caseInfo.content`.

## Architecture and scope

This CLI implements Phase 1 of `pega-dx-cli`. Phase 2 adds the remaining Pega tool categories (attachments, data views, case types, participants, followers, related cases, tags, documents), a `table` output format, and an `--interactive` wizard mode for assignment flows. Phase 3 delivers standalone binaries and shell completions.

The API V2 client is ported from the [pega-dx-mcp](https://github.com/marco-looy/pega-dx-mcp) MCP server. Only Constellation DX API (V2) is supported; V1 is out of scope.
