# Changelog

All notable changes to `pega-dx-cli` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-15

### Added — full v25.1.2 coverage

- Every operation in `dx-api.yaml` (Pega DX API v25.1.2) now has a CLI command.
  See [reference/api-coverage.md](reference/api-coverage.md) for the full mapping.
- `scripts/audit-endpoints.ts` — re-runnable audit tool (`npm run audit:endpoints`)
  that emits the coverage matrix and exits non-zero on any gap or drift.
- `scripts/check-examples.ts` — enforces ≥1 `static example` per command.
- `test/smoke/` — live-instance smoke harness (`npm run smoke`), one suite per
  oclif topic. Uses `execa` to run the CLI as a subprocess and asserts on
  stdout JSON + exit code. Hybrid bootstrap (create-then-delete) keeps suites
  idempotent.

### Changed

- Every command now exports an `__endpoint` constant declaring its spec source.

### CI

- `.github/workflows/ci.yml` runs lint, build, tests, audit, and example-check
  on every PR. Smoke tests stay a local pre-tag maintainer check.

## [0.9.0] - 2026-05-14

### Added
- `assignments perform --interactive` — TTY wizard that picks an action, prompts
  for required fields, and confirms before submission. Stdout stays clean JSON;
  all prompts and progress go to stderr. New runtime dependency: `inquirer`.

### Documentation
- README: new "Interactive mode" and "Piping & scripting" sections.

### Internal
- Phase 2 backlog (B-1 .. B-5) marked resolved in
  `docs/superpowers/specs/phase-2-backlog.md`. All five items were addressed
  in earlier phases; the backlog doc was simply not updated. See the doc for
  evidence pointers (file:line references).

## [0.8.0] - 2026-05-13

### Added — `social` group (14 commands)
- `social get-feed <feedID> --filter-for <ctx>` — GET /feeds/{feedID}
- `social list-mentions --mentions-type <type>` — GET /mentions
- `social list-mention-types` — GET /mention_types
- `social list-messages --filter-by <src> --filter-for <ctx>` — GET /messages
- `social post-message --context <ctx> --message <text>` — POST /messages
- `social get-message <messageID>` — GET /messages/{messageID}
- `social update-message <messageID> --message <text>` — PUT /messages/{messageID}
- `social delete-message <messageID>` — DELETE /messages/{messageID}
- `social list-likes <messageID>` — GET /messages/{messageID}/likes
- `social like-message <messageID>` — POST /messages/{messageID}/likes
- `social unlike-message <messageID>` — DELETE /messages/{messageID}/likes
- `social get-message-type <type>` — GET /message-types/{type}
- `social list-suggested-tags` — GET /suggested_tags
- `social search-tags` — GET /tags

### Added — `recents` group (2 commands)
- `recents list [--max-results <n>]` — GET /recents
- `recents update --label <l> --id <id>` — PATCH /recents

### Added — `ui-lists` group (5 commands)
- `ui-lists move <viewName> --source-id <s> --destination-id <d>` — PATCH /ui_lists/{viewName}/move
- `ui-lists list-personalizations <uiListID>` — GET /ui_lists/{uiListID}/personalizations
- `ui-lists create-personalization <uiListID> --name <n>` — POST /ui_lists/{uiListID}/personalizations
- `ui-lists update-personalization <uiListID> <personalizationID> --name <n>` — PUT /ui_lists/{uiListID}/personalizations/{personalizationID}
- `ui-lists delete-personalization <uiListID> <personalizationID>` — DELETE /ui_lists/{uiListID}/personalizations/{personalizationID}

### Added — `user-settings` group (2 commands)
- `user-settings get` — GET /user_settings
- `user-settings patch --data <json|@file|->` — PATCH /user_settings

### Added — `auth-profiles` group (2 commands)
- `auth-profiles get <authProfileName> [--gadget-id <id>]` — GET /authentication-profiles/{authProfileName}
- `auth-profiles revoke-tokens <authProfileName> [--gadget-id <id>]` — DELETE /authentication-profiles/{authProfileName}/user-tokens

### Added — existing groups (2 commands)
- `auth refresh-b2s --token <token>` — POST /refreshB2S
- `static-content profile-image <userId> [--output <path>]` — GET /users/{userId}/profile-image

## [0.6.0] - 2026-05-11

### Added — `ai-agents` group (8 commands)
- `ai-agents list` — GET /ai-agents
- `ai-agents list-conversations <agentId> --context-id <ctx> [--page-size --page-index]`
- `ai-agents start-conversation <agentId> [--context-id --interaction-id --execute-starter --active-channel --active-channel-id]`
- `ai-agents get-conversation <agentId> --conversation <id>`
- `ai-agents send-message <agentId> --conversation <id> --request <text> [--attachments --active-channel --active-channel-id]`
- `ai-agents close-conversation <agentId> --conversation <id>`
- `ai-agents like <agentId> --conversation <id> --message <msgId>`
- `ai-agents dislike <agentId> --conversation <id> --message <msgId> --feedback <text>`

### Added — `assistants` group (5 commands)
- `assistants list-conversations <assistantId> --context-id <ctx> [--page-size --page-index]`
- `assistants start-conversation <assistantId> [--context-id --interaction-id --execute-starter]`
- `assistants get-conversation <assistantId> --conversation <id>`
- `assistants send-message <assistantId> --conversation <id> --request <text>`
- `assistants close-conversation <assistantId> --conversation <id>`

### Changed
- `BaseCommand.runPut` and `BaseCommand.runPatch` dry-run output now honours `body=undefined`: no `Content-Type: application/json` header and no `body` field emitted when the request carries no body. Live request path was already correct. Unblocks honest dry-run for the four no-body PUTs in this release.

### Internal
- Updated source-of-truth memory to put `dx-api.yaml` (OpenAPI 3 spec) at the top of the priority order. PDF and Swagger HTML drop to fallbacks.

## [0.5.0] - 2026-05-11

### Added — `attachments` group (6 commands)

- `pega attachments upload --file <path> [--append-unique-id]` — `POST /attachments/upload` (multipart)
- `pega attachments add <caseId> --attachments <json>` — `POST /cases/{caseID}/attachments` (atomic batch)
- `pega attachments list <caseId> [--include-thumbnails]` — `GET /cases/{caseID}/attachments`
- `pega attachments get <id> [--output <path>]` — `GET /attachments/{attachmentID}` (dual-mode: raw JSON or decoded file write)
- `pega attachments delete <id>` — `DELETE /attachments/{attachmentID}`
- `pega attachments patch <id> [--name] [--category]` — `PATCH /attachments/{attachmentID}` (no eTag)

### Added — `data` group (15 commands)

Catalog: `data list-objects`, `data list-pages`.
Read/query: `data get`, `data get-metadata`, `data query`, `data count`, `data query-metadata`, `data query-view`.
Record CRUD: `data create`, `data update`, `data patch`, `data delete`.
Actions: `data list-actions`, `data get-action`, `data perform-action`.

### Internal

- New: `PegaApiClient.uploadMultipart<T>(path, formData, opts?)` for multipart POSTs.
- New: `BaseCommand.runPatch(flags, path, body, opts?)` — no-eTag PATCH wrapper, mirrors `runPost`.
- New: `BaseCommand.runPut(flags, path, body, opts?)` — no-eTag PUT wrapper.
- New: `composeDataQueryBody(flags, shape)` in `src/lib/input.ts`. Two shapes: `'query'` and `'count-or-metadata'`.
- Changed: `BaseCommand.runPost` accepts an optional `RequestOpts` parameter (additive; existing callers unaffected). Used by the four `data` query commands to set `timeoutMs: EXTENDED_TIMEOUT_MS`.
- New: `mockMultipartUpload` test helper in `test/helpers/mock-pega-api.ts`.

### Notes

- `attachments get --output`: real-Pega verification confirmed the response shape is `{"message":"<base64>"}` for files (no `type` field). The `--output` implementation detects content by field presence (`message` → Base64 decode, `url` → URL string, `content` → Correspondence HTML). Fixed and verified in 0.5.0.
- `data create` and `data update` wrap the user-supplied `--data` object in `{"data":{...}}` before sending, matching the official API body schema (p.595-597 of the DX API PDF).
- `data update` uses direct PUT (no eTag), `data patch` uses direct PATCH (no eTag), `data perform-action` uses direct PATCH (no eTag). None of the `/data/{id}` CRUD endpoints use If-Match — confirmed from official Pega DX API PDF.
- `data delete` accepts `--params` (JSON object) which is appended as a query string (e.g. `--params '{"AccountID":"123"}'` → `?AccountID=123`). The exact parameter name is data-view-specific.
- `data perform-action` body shape mirrors `cases perform-action` (`{content, pageInstructions, attachments}`).
- `data list-pages` requires `--type all|explorable` (defaults to `all`). The `type` parameter is mandatory in the Pega API; `--type explorable` verified returning 57 pages on the demo instance.
- Real-Pega verified against `D_AccountSavable` (class `Uplus-Core-Data-Account`): `data create` ✅ 200, `data update` ✅ 200, `data get-metadata` ✅ 200, `data query` (list view) ✅ 200. PATCH/DELETE return 422/400 on this demo instance — consistent with those save plan branches not being configured (Pega server-side limitation, not CLI bugs).

## [0.4.0] - 2026-05-06

### BREAKING

- **`participants get`, `participants delete`, `participants update`** — `--role` flag renamed to `--participant-id`. The second URL segment in the official Pega DX V2 spec is `{participantID}`, not `{role}`.
- **`participants add`** — `--user` replaced by `--data` (content page JSON with person fields). The request now includes an auto-fetched eTag and uses `participantRoleID` as the body key.
- **`cases recalculate`, `assignments recalculate`** — `--data` is now required with `{calculations:{fields:[...]}}` body. Previous mutation-body flags (`--page-instructions`, `--interest-page`, `--interest-page-action-id`, `--attachments`) are removed.
- **`participants replace` and `participants delete-bulk`** removed. Endpoints do not exist in the official Pega DX V2 docs.

### Added

- `cases bulk-actions` — list available bulk actions across cases
- `cases bulk-perform` — perform an action across multiple cases
- `cases start-process` — start an optional or stage process
- `cases list-stages` — list case stages
- `cases refresh-action` — refresh a case action view
- `cases recalculate` — recalculate calculated fields and when conditions
- `cases refresh-view` — refresh a named view
- `cases calc-fields` — compute calculated fields for a view
- `cases discard-updates` — release the case lock
- `cases list-attachment-categories` — list configured attachment categories
- `case-types list-bulk-actions` — list bulk actions for a case type (Launchpad only)
- `participants list-roles` — list participant roles configured on a case
- `participants get-role` — get details of a specific participant role
- `documents delete` — remove a document linked to a case
- `assignments recalculate` — recalculate calculated fields for an assignment action
- `assignments navigate-to-step` — jump to a specific step
- New `composeMutationBody(flags, shape)` helper in `src/lib/input.ts` for `{content, pageInstructions, attachments, interestPage, interestPageActionID}` composition

### Changed

- **`cases perform-action`, `assignments perform`, `assignments save`** — body extended to `{content, pageInstructions, attachments}`. New flags `--page-instructions` and `--attachments`. Backwards-compatible: `--data`-only still works.
- **`assignments refresh-action`** — body extended to `{content, pageInstructions, interestPage, interestPageActionID}`. New flags `--page-instructions`, `--interest-page`, `--interest-page-action-id`. `--attachments` is rejected with `INVALID_ARGS`.
- **`assignments navigate-back`** — body extended to `{content, pageInstructions, attachments}`. New flags as above.

### Removed

- `participants replace` (broken endpoint)
- `participants delete-bulk` (broken endpoint)
- 4 NOT_IMPLEMENTED stubs from 2b.1: `documents list`, `assignments list`, `assignments query`, `cases get-page`

### Source of truth

From this version onwards, the canonical reference for endpoint paths/methods/bodies is the official Pega DX V2 endpoint reference (Swagger HTML + PDF). The MCP source repo is no longer trusted (it contained two endpoints that don't exist in Pega).

## [0.3.0] - 2026-04-27

Phase 2b.1: 35 new commands across 8 groups, plus four shared `BaseCommand` helpers (`runGet`, `runDelete`, `runPost`, `runMutateWithEtag`).

## [0.2.0] - 2026-04-26

Phase 2a: profile support, output format additions (`yaml`, `table`), per-profile token cache, `--data` input forms, header redaction.

## [0.1.0] - 2026-04-24

Phase 1: foundational CLI with `auth`, `cases`, `assignments` groups; OAuth 2.1; `BaseCommand` framework.
