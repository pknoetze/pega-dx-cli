# Changelog

All notable changes to `pega-dx-cli` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- New: `composeDataQueryBody(flags, shape)` in `src/lib/input.ts`. Two shapes: `'query'` and `'count-or-metadata'`.
- Changed: `BaseCommand.runPost` accepts an optional `RequestOpts` parameter (additive; existing callers unaffected). Used by the four `data` query commands to set `timeoutMs: EXTENDED_TIMEOUT_MS`.
- New: `mockMultipartUpload` test helper in `test/helpers/mock-pega-api.ts`.

### Notes

- `attachments get --output`: real-Pega verification confirmed the response shape is `{"message":"<base64>"}` for files (no `type` field). The `--output` implementation detects content by field presence (`message` → Base64 decode, `url` → URL string, `content` → Correspondence HTML). Fixed and verified in 0.5.0.
- `data update`/`data patch`/`data perform-action` assume eTag-required (matching case/assignment mutations); `runMutateWithEtag` errors loudly if the GET-parent omits `ETag`.
- `data perform-action` body shape mirrors `cases perform-action` (`{content, pageInstructions, attachments}`).

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
