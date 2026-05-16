# Pega Case Lifecycle — When to read this

Read this reference when the user needs to: create or fetch a case, walk
an assignment, perform a case or assignment action, navigate stages, or
bulk-act on multiple cases. For auth, eTags, page-instructions, output
formats, or exit codes, read concepts.md instead.

## Table of contents

1. Discovery: case-types → create-fields
2. Creating cases
3. Fetching cases and embedded data
4. Stage navigation
5. Assignments: get-next, get, perform
6. Walking an assignment (`--interactive` vs `--data`)
7. `cases perform-action` vs `assignments perform`
8. Recalculate (cases + assignments)
9. Bulk actions

## 1. Discovery: case-types → create-fields

Before creating a case the agent usually does not know which case types
exist in the target application, nor which fields the creation action
requires. The `case-types` group answers both questions without writing
any data. Always discover first — guessing a `--type` value leads to a
404 and a confusing error chain.

```bash
# 1) Find the case type ID
pega case-types list

# 2) Fetch the creation action's view to learn required fields.
#    pyStartCase is the conventional create action; some apps rename it.
pega case-types get-action Uplus-FS-Work-ProductComplaint --action pyStartCase
```

The response from `get-action` contains a `uiResources` block with the
field list, allowed values, and required flags — this is the shape the
next step's `--data` payload needs to match.

> **Gotcha:** `case-types get <id>` is a client-side filter over
> `case-types list` because Pega DX V2 has no `GET /casetypes/{id}`
> endpoint. If the case type ID is misspelled the filter returns an
> empty array, not a 404 — verify the ID against the `list` output
> before retrying.

## 2. Creating cases

`pega cases create` POSTs to `/cases`. The `--type` flag is required and
maps to `caseTypeID` in the request body. Field values go in `--data`,
which the CLI wraps in a `content` object so the call body becomes
`{ caseTypeID, content }`.

```bash
# Minimal create — the case type's create action must accept an empty body
pega cases create --type InsuranceClaim

# Create with prefilled fields
pega cases create --type InsuranceClaim --data @claim.json

# Inline JSON works too
pega cases create --type InsuranceClaim --data '{"FirstName":"Ada"}'
```

The response includes `data.caseInfo.ID` (the full case handle, e.g.
`MYAPP-WORK-CASE A-1`) — capture this for every follow-up operation. The
response also includes the `nextAssignmentInfo` block when an assignment
is auto-created, which means you usually do **not** need to call
`assignments get-next` immediately after create.

> **Gotcha:** `--data` content must match the field shape returned by
> `case-types get-action`. Submitting unknown fields silently drops
> them; submitting wrongly-typed fields yields a 422 with a Pega
> validation message. Use the discovery step in section 1 instead of
> guessing.

## 3. Fetching cases and embedded data

`pega cases get <caseId>` returns the full case envelope, including
`data.caseInfo.content` (the case's persistent fields), `assignments`
(active worklist entries), `availableActions`, and `stages`. Most agent
work pulls fields out of `caseInfo.content`.

```bash
# Whole case
pega cases get MYAPP-WORK-CASE-1

# Narrow the response to specific top-level fields (faster, smaller).
# --fields is a global flag handled by the output layer; see concepts.md.
pega cases get MYAPP-WORK-CASE-1 --fields data.caseInfo.content,data.caseInfo.status

# Fetch a named view rendered by the case (different content page)
pega cases get-view MYAPP-WORK-CASE-1 --view Summary
```

For larger reads, `get-view` returns only the view's slice of content
rather than the entire envelope — this is the right tool when the agent
needs one tab's worth of fields and nothing else.

> **Gotcha:** `data.caseInfo.content` contains property names with the
> leading-dot stripped (`OrderTotal`, not `.OrderTotal`). Recalculate
> bodies, by contrast, use the dot-prefixed form (`.OrderTotal`). Mixing
> them silently produces an empty calculation result.

## 4. Stage navigation

Stages move the case forward in its primary lifecycle. There are two
verbs: advance to the next stage in sequence, or jump to a specific
named stage. Both require the case to be in a stage with a valid
transition path; otherwise the server returns 422.

```bash
# Advance to the next stage in the configured order
pega cases stage-next MYAPP-WORK-CASE-1

# Jump to a named stage (PUT /cases/{id}/stages/{stageName})
pega cases stage-go MYAPP-WORK-CASE-1 --stage Resolution

# Inspect available stages first if uncertain
pega cases list-stages MYAPP-WORK-CASE-1
```

Both stage commands auto-fetch the eTag from the parent case before
PUT/POST — the CLI handles this transparently. See concepts.md section
2 for the eTag mechanics.

> **Gotcha:** `--stage` takes the **stage name** as configured in App
> Studio (often a display label like `Resolution`), not the internal
> `PRIM0` rule ID. Use `list-stages` to retrieve the exact values when
> in doubt.

## 5. Assignments: get-next, get, perform

An assignment is a single step in a case's flow that requires a user (or
agent) action. The three core verbs are: pull the next assignment off
the worklist, fetch a specific assignment by ID, and perform an action
on it.

```bash
# Pull whatever is next from the operator's worklist
pega assignments get-next

# Fetch a specific assignment when its handle is known.
# The handle uses spaces and a !FLOW suffix: 'ASSIGN-WORKLIST X-1!FLOW'
pega assignments get 'ASSIGN-WORKLIST MYAPP-WORK-CASE A-1!FLOW'

# Submit an action on an assignment (CLI auto-fetches the eTag)
pega assignments perform 'ASSIGN-WORKLIST A-1!FLOW' --action Submit --data @form.json
```

`get-next` returns `{ assignment: null }` (not an error) when the
worklist is empty — agents can treat this as a normal completion
signal rather than a 404.

> **Gotcha:** Assignment handles contain spaces and `!`. Always single-
> quote them in shell, or the shell will split the argument and the CLI
> will see a malformed ID.

## 6. Walking an assignment (`--interactive` vs `--data`)

`assignments perform` supports two completion modes that are mutually
exclusive at runtime.

```bash
# Interactive (TTY only): the CLI fetches the action view, prompts for
# each required field, then submits. Cannot be combined with --action,
# --data, --page-instructions, --attachments, or --dry-run.
pega assignments perform 'ASSIGN-WORKLIST A-1!FLOW' --interactive

# Non-interactive (CI-safe): every value is supplied up-front.
pega assignments perform 'ASSIGN-WORKLIST A-1!FLOW' \
  --action Submit --data @form.json
```

When stdin is not a TTY, `--interactive` is silently ignored with a
warning to stderr; the command then requires `--action` and behaves
like the non-interactive form. This makes scripts that pass
`--interactive` opportunistically safe to run in CI — they degrade to
needing explicit data rather than hanging on a prompt.

> **Gotcha:** Interactive mode auto-detects required fields from the
> action view. If detection returns zero fields (very simple actions
> like `pyApprove`), the command errors with `could not auto-detect
> required fields` — fall back to `--action <name> --data '{}'`.

## 7. `cases perform-action` vs `assignments perform`

These two verbs look interchangeable but operate at different layers of
the model.

- `pega cases perform-action <caseId> --action <name>` operates at the
  **case** level. Use this for case-wide actions that are not bound to
  a worklist item — typically things in `availableActions` on the case
  envelope (Approve, Reject, AddNote, attachments, etc.).
- `pega assignments perform <assignmentId> --action <name>` operates on
  a **specific assignment**. Use this when filling in form fields and
  completing a flow step — anything that advances a worklist entry.

```bash
# Case-level: approve the entire case (PATCH /cases/{id}/actions/{actionID})
pega cases perform-action MYAPP-WORK-CASE-1 --action Approve --data '{"reason":"OK"}'

# Assignment-level: submit the current form step
# (PATCH /assignments/{assignID}/actions/{actionID})
pega assignments perform 'ASSIGN-WORKLIST A-1!FLOW' --action Submit --data @form.json
```

Both commands accept `--data`, `--page-instructions`, and
`--attachments`, and both auto-fetch the eTag from their parent
resource. The difference is which endpoint receives the PATCH and which
URN the eTag is read from.

> **Gotcha:** If `availableActions` on the case envelope lists an
> action, use `cases perform-action`. If `actions` inside an
> `assignments[]` entry lists it, use `assignments perform`. Calling
> the wrong one returns 404 with no hint that the right endpoint
> exists.

## 8. Recalculate (cases + assignments)

Recalculate triggers Pega to re-evaluate calculated fields and
when-conditions for a specific action without committing the action.
Use it after the user changes a field value to refresh dependent
totals before submitting.

```bash
# Case-level recalculate (PATCH /cases/{id}/actions/{actionID}/recalculate)
pega cases recalculate MYAPP-WORK-CASE-1 --action Approve \
  --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'

# Assignment-level recalculate
# (PATCH /assignments/{assignID}/actions/{actionID}/recalculate)
pega assignments recalculate 'ASSIGN-WORKLIST A-1!FLOW' --action Submit \
  --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'
```

Both commands require `--action` and `--data`. The `--data` body must
follow the `{ calculations: { fields: [...] } }` shape; each field
needs `name` (dot-prefixed) and `context` (`"content"` for top-level
fields, or an embedded page name).

> **Gotcha:** Field `name` in the calculations payload uses the
> dot-prefixed property reference (`.OrderTotal`), unlike the
> `caseInfo.content` read shape which strips the dot. Mismatched
> dot-prefixes silently produce an empty `calculations` array in the
> response — no error, just no result.

## 9. Bulk actions

Bulk operations let an agent act on many cases in one round-trip. The
flow is: discover which actions are valid across the chosen set, then
fire the action. Never call `bulk-perform` blind — an action that is
not in every case's `availableActions` causes per-case 4xx entries in
the multistatus response.

```bash
# 1) Find the intersection of available actions for a set of cases
pega cases bulk-actions --cases CASE-1,CASE-2,CASE-3

# 2) Perform the action across all cases. Sync mode returns a 207
#    multistatus array (one entry per case).
pega cases bulk-perform --action Approve --cases CASE-1,CASE-2,CASE-3 \
  --data '{"reason":"batch close"}'

# 3) Launchpad-only async mode returns 202 with a jobID
pega cases bulk-perform --action Approve --cases CASE-1,CASE-2 --running-mode async
```

The bulk endpoint does **not** require `If-Match`, so the CLI does not
auto-fetch eTags for `bulk-perform`. Partial failures (any per-case
`status >= 400` in the 207 array) cause the command to exit with
`BULK_PARTIAL_FAILURE` after still emitting the full response — useful
for CI scripts that need to inspect which cases failed.

> **Gotcha:** `--cases` is comma-separated with no spaces — `CASE-1,
> CASE-2` (with the space) sends a literal ` CASE-2` ID to the server
> and that case's entry will come back 404 in the multistatus.

## See also

- `concepts.md` section 2 — eTag rules (how `runMutateWithEtag` fetches
  and sends `If-Match`).
- `concepts.md` section 3 — page-instructions cookbook (the
  `--page-instructions` flag shape used by `perform-action`,
  `assignments perform`, and `bulk-perform`).
- `concepts.md` section 4 — `--fields`, `--output`, and the table
  renderer used by all read commands above.
- `data-views.md` — when the case envelope references a savable data
  record, switch to the data reference for the CRUD verbs.
