# pega-dx Command Catalog (generated)

> Auto-generated from `oclif.manifest.json`. Do not edit by hand.
> Regenerate with `npm run generate:skill-catalog`.

## auth

### `pega auth diagnose`

Run diagnostic checks against Pega configuration

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega auth diagnose
```

### `pega auth login`

Acquire a fresh OAuth token and cache it

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega auth login
```

### `pega auth ping`

Check Pega API V2 reachability

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega auth ping
```

### `pega auth refresh-b2s`

Refresh a B2S authentication token

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--token` | option | Yes | Existing B2S token to refresh |

```bash
pega auth refresh-b2s --token OLD_TOKEN
```

## cases

### `pega cases bulk-actions`

List bulk actions available across a set of cases

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--cases` | option | Yes | Comma-separated case IDs |

```bash
pega cases bulk-actions --cases CASE-1,CASE-2,CASE-3
```

### `pega cases bulk-perform`

Perform an action across multiple cases in a single API call

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Case action ID |
| `--cases` | option | Yes | Comma-separated case IDs |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--attachments` | option | No | JSON attachments array (inline, @file, or -) |
| `--running-mode` | option | No | Launchpad-only: async (returns 202 with jobID) |

```bash
pega cases bulk-perform --action Approve --cases CASE-1,CASE-2,CASE-3
```

### `pega cases calc-fields`

Compute calculated fields for a case view

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--view` | option | Yes | View name |
| `--data` | option | Yes | JSON: {calculations:{fields:[{name:".X",context:"content"}]}} (inline, @file, or -) |

```bash
pega cases calc-fields MYAPP-CASE-1 --view Summary --data @fields.json
```

### `pega cases create`

Create a new Pega case (V2)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--type` | option | Yes | Case type ID |
| `--data` | option | No | JSON content (inline, @file, or - for stdin) |

```bash
pega cases create --type InsuranceClaim
```

### `pega cases delete`

Delete a Pega case (V2)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases delete MYAPP-CASE-1
```

### `pega cases discard-updates`

Release the case lock (discard pending updates)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases discard-updates MYAPP-CASE-1
```

### `pega cases get`

Get a Pega case by ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases get MYAPP-CASE-1 --fields status,urgency
```

### `pega cases get-action`

Get the view/form for a specific action on a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Case action ID |

```bash
pega cases get-action MYAPP-CASE-1 --action Approve
```

### `pega cases get-view`

Get a named view for a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--view` | option | Yes | View name |

```bash
pega cases get-view MYAPP-CASE-1 --view Summary
```

### `pega cases list-ancestors`

List all ancestor cases in the case hierarchy

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases list-ancestors MYAPP-CASE-1
```

### `pega cases list-attachment-categories`

List configured attachment categories on a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases list-attachment-categories MYAPP-CASE-1
```

### `pega cases list-descendants`

List all descendant cases in the case hierarchy

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases list-descendants MYAPP-CASE-1
```

### `pega cases list-stages`

List stages for a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases list-stages MYAPP-CASE-1
```

### `pega cases perform-action`

Perform a case-level action

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Case action ID |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--attachments` | option | No | JSON attachments array (inline, @file, or -) |

```bash
pega cases perform-action MYAPP-CASE-1 --action Approve
```

### `pega cases recalculate`

Recalculate calculated fields and when conditions for a case action

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Case action ID |
| `--data` | option | Yes | JSON: {calculations:{fields:[{name:".X",context:"content"}]}} (inline, @file, or -) |

```bash
pega cases recalculate MYAPP-CASE-1 --action Approve --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'
```

### `pega cases refresh-action`

Refresh a case action view (re-render form)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Case action ID |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--interest-page` | option | No | Embedded list row reference. Infinity '25+ |
| `--interest-page-action-id` | option | No | Action ID of the inner action. Infinity '25+ |
| `--attachments` | option | No | NOT ACCEPTED for refresh — INVALID_ARGS if passed |

```bash
pega cases refresh-action MYAPP-CASE-1 --action Approve
```

### `pega cases refresh-view`

Refresh a named case view

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--view` | option | Yes | View name |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array |
| `--interest-page` | option | No | Embedded page reference (e.g. .PageList(1)) |
| `--interest-page-action-id` | option | No | Action ID of the inner action |
| `--attachments` | option | No | NOT ACCEPTED — refresh-shape rejects attachments |

```bash
pega cases refresh-view MYAPP-CASE-1 --view Summary
```

### `pega cases stage-go`

Move the case to a specific named stage

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--stage` | option | Yes | Stage name |

```bash
pega cases stage-go MYAPP-CASE-1 --stage Resolution
```

### `pega cases stage-next`

Advance the case to the next stage

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega cases stage-next MYAPP-CASE-1
```

### `pega cases start-process`

Start an optional or stage process on a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--process` | option | Yes | Process ID |

```bash
pega cases start-process MYAPP-CASE-1 --process pyAddNote
```

## assignments

### `pega assignments get`

Get a Pega assignment by ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega assignments get ASSIGN-WORKLIST X-1!FLOW
```

### `pega assignments get-action`

Get the action/view details for a specific action on an assignment

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Flow action ID |

```bash
pega assignments get-action ASSIGN-1 --action Submit
```

### `pega assignments get-next`

Get the next assignment from the worklist

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega assignments get-next
```

### `pega assignments navigate-back`

Navigate back to the previous step in a multi-step assignment

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--attachments` | option | No | JSON attachments array (inline, @file, or -) |

```bash
pega assignments navigate-back ASSIGN-1
```

### `pega assignments navigate-to-step`

Navigate to a specific step in a multi-step assignment

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--step` | option | Yes | Step ID |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array |
| `--attachments` | option | No | JSON attachments array |

```bash
pega assignments navigate-to-step ASSIGN-1 --step Step3
```

### `pega assignments perform`

Perform an assignment action (auto-fetches eTag)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | No | Action ID (required unless --interactive) |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--attachments` | option | No | JSON attachments array (inline, @file, or -) |
| `--interactive` | boolean | No | Walk through action + required fields via prompts (TTY only) |

```bash
pega assignments perform ASSIGN-1 --action Submit --data @form.json
```

### `pega assignments recalculate`

Recalculate calculated fields and when conditions for an assignment action

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Action ID |
| `--data` | option | Yes | JSON: {calculations:{fields:[{name:".X",context:"content"}]}} (inline, @file, or -) |

```bash
pega assignments recalculate ASSIGN-1 --action Submit --data '{"calculations":{"fields":[{"name":".Total","context":"content"}]}}'
```

### `pega assignments refresh-action`

Refresh a field after a value change

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Action ID |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--interest-page` | option | No | Embedded list row reference (e.g. .OrderItems(1)). Infinity '25+ |
| `--interest-page-action-id` | option | No | Action ID of the inner ('interest page') action. Infinity '25+ |
| `--attachments` | option | No | NOT ACCEPTED for refresh (use perform-action or save instead). Errors with INVALID_ARGS. |

```bash
pega assignments refresh-action ASSIGN-1 --action Submit --data '{"field":"new"}'
```

### `pega assignments save`

Save a draft of an in-progress assignment

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Action ID |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--attachments` | option | No | JSON attachments array (inline, @file, or -) |

```bash
pega assignments save ASSIGN-1 --action Submit --data @draft.json
```

## social

### `pega social delete-message`

Delete a Pulse message

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega social delete-message MSG-1
```

### `pega social get-feed`

Get a Pulse feed list

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--filter-for` | option | Yes | contextID or userID (→ ?filterFor=) |
| `--older-than` | option | No | Only entries older than this datetime (→ ?olderThan=) |
| `--page-size` | option | No | Max entries (→ ?pageSize=) |
| `--feed-class` | option | No | Pulse feed rule class (→ ?feedClass=) |
| `--filter-by` | option | No | Feed source list, comma-separated (→ ?filterBy=) |

```bash
pega social get-feed MyFeed --filter-for MYORG-WORK\!M-1
```

### `pega social get-message`

Get a Pulse message by ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega social get-message MSG-1
```

### `pega social get-message-type`

Get the create-form view metadata for a Pulse message type

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega social get-message-type Pulse-Post
```

### `pega social like-message`

Add a like to a Pulse message

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega social like-message MSG-1
```

### `pega social list-likes`

List likes on a Pulse message

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega social list-likes MSG-1
```

### `pega social list-mention-types`

List Pulse mention types

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega social list-mention-types
```

### `pega social list-mentions`

List mentions for a search string and type

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--mentions-type` | option | Yes | → ?mentionsType= |
| `--context` | option | No | Pulse gadget context (→ ?context=) |
| `--search-for` | option | No | → ?searchFor= |
| `--list-size` | option | No | → ?listSize= |

```bash
pega social list-mentions --mentions-type Operators --search-for jdoe
```

### `pega social list-messages`

List Pulse messages for a context

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--filter-by` | option | Yes | → ?filterBy= |
| `--filter-for` | option | Yes | → ?filterFor= |
| `--page-size` | option | No | → ?pageSize= |
| `--older-than` | option | No | → ?olderThan= |

```bash
pega social list-messages --filter-by Pulse --filter-for MYORG-WORK\!M-1
```

### `pega social list-suggested-tags`

List suggested + recent tags for a Pulse context

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--context` | option | No | → ?context= |

```bash
pega social list-suggested-tags --context MYORG-WORK\!M-1
```

### `pega social post-message`

Post a new Pulse message

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--context` | option | Yes | Pulse context ID |
| `--message` | option | Yes | Message text |
| `--route-to-workbasket` | option | No | pyRouteToWorkbasket value |
| `--message-type` | option | No | → ?message-type= (query string, not body) |

```bash
pega social post-message --context MYORG-WORK\!M-1 --message "hello"
```

### `pega social search-tags`

Search tags by string

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--search-for` | option | No | → ?searchFor= |
| `--list-size` | option | No | → ?listSize= |

```bash
pega social search-tags --search-for security --list-size 20
```

### `pega social unlike-message`

Remove a like from a Pulse message

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega social unlike-message MSG-1
```

### `pega social update-message`

Edit a Pulse message

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--message` | option | Yes | New message text |
| `--route-to-workbasket` | option | No | pyRouteToWorkbasket |

```bash
pega social update-message MSG-1 --message "edited"
```

## recents

### `pega recents list`

List the operator's recent items

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--max-results` | option | No | Maximum recents to fetch (≤0 returns all) (→ ?maxResultsToFetch=) |

```bash
pega recents list
```

### `pega recents update`

Add or update a recent item

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--label` | option | Yes | pyLabel value |
| `--id` | option | Yes | pyID value |

```bash
pega recents update --label "My Case" --id MYORG-WORK\!M-1
```

## ui-lists

### `pega ui-lists create-personalization`

Create a personalization on a UI list

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--name` | option | Yes | Personalization name |
| `--id` | option | No | ID |
| `--personalization-state` | option | No | personalizationState (verbatim string) |
| `--mark-as-default` | boolean | No | markAsDefault |
| `--mark-as-app-default` | boolean | No | markAsAppDefault |
| `--route-to-workbasket` | option | No | pyRouteToWorkbasket |

```bash
pega ui-lists create-personalization LIST-1 --name "My View"
```

### `pega ui-lists delete-personalization`

Delete a personalization on a UI list

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega ui-lists delete-personalization LIST-1 PERS-1
```

### `pega ui-lists list-personalizations`

List personalizations for a UI list

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega ui-lists list-personalizations LIST-1
```

### `pega ui-lists move`

Move a record within a UI list

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--source-id` | option | Yes | sourceID |
| `--destination-id` | option | Yes | destinationID |
| `--context` | option | No | context (optional) |
| `--list-class` | option | No | listClass (optional) |

```bash
pega ui-lists move MyListView --source-id R-1 --destination-id R-2
```

### `pega ui-lists update-personalization`

Update a personalization on a UI list

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--name` | option | Yes | Personalization name |
| `--id` | option | No | ID |
| `--personalization-state` | option | No | personalizationState (verbatim string) |
| `--mark-as-default` | boolean | No | markAsDefault |
| `--mark-as-app-default` | boolean | No | markAsAppDefault |
| `--route-to-workbasket` | option | No | pyRouteToWorkbasket |

```bash
pega ui-lists update-personalization LIST-1 PERS-1 --name "Edited"
```

## user-settings

### `pega user-settings get`

Get operator user settings

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega user-settings get
```

### `pega user-settings patch`

Patch operator user settings

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--data` | option | Yes | JSON body (inline, @file, or -) |

```bash
pega user-settings patch --data '{"patchPreference":"someValue"}'
```

## auth-profiles

### `pega auth-profiles get`

Get an authentication profile

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--gadget-id` | option | No | Gadget ID (→ ?gadgetId=) |

```bash
pega auth-profiles get MyProfile
```

### `pega auth-profiles revoke-tokens`

Revoke user-specific tokens for an authentication profile

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--gadget-id` | option | No | Gadget ID (→ ?gadgetId=) |

```bash
pega auth-profiles revoke-tokens MyProfile
```

## ai-agents

### `pega ai-agents close-conversation`

Close an AI agent conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |

```bash
pega ai-agents close-conversation MYAGENT --conversation PXCONV-1
```

### `pega ai-agents dislike`

Dislike a message in an AI agent conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |
| `--message` | option | Yes | Message ID to dislike |
| `--feedback` | option | Yes | Free-text feedback (becomes feedbackText in body) |

```bash
pega ai-agents dislike MYAGENT --conversation PXCONV-1 --message MSG-1 --feedback "off topic"
```

### `pega ai-agents get-conversation`

Get details of a single AI agent conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |

```bash
pega ai-agents get-conversation MYAGENT --conversation PXCONV-503025
```

### `pega ai-agents like`

Like a message in an AI agent conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |
| `--message` | option | Yes | Message ID to like |

```bash
pega ai-agents like MYAGENT --conversation PXCONV-1 --message MSG-1
```

### `pega ai-agents list`

Fetch all AI agents enabled for external access

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega ai-agents list
```

### `pega ai-agents list-conversations`

List conversations for an AI agent

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--context-id` | option | Yes | Context ID (case context or landing-page context) |
| `--page-size` | option | No | Results per page |
| `--page-index` | option | No | Page index (0-based) |

```bash
pega ai-agents list-conversations MYAGENT --context-id MYORG-MYAPP-WORK\!M-123
```

### `pega ai-agents send-message`

Send a message in an AI agent conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |
| `--request` | option | Yes | User query text |
| `--attachments` | option | No | JSON array of attachment descriptors (inline JSON, @file, or - for stdin) |
| `--active-channel` | option | No | Channel type (Web, Email, Chat, ...) |
| `--active-channel-id` | option | No | Unique ID of the channel |

```bash
pega ai-agents send-message MYAGENT --conversation PXCONV-1 --request "hello"
```

### `pega ai-agents start-conversation`

Start a new AI agent conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--context-id` | option | No | Context ID (case or landing-page context) |
| `--interaction-id` | option | No | Unique ID for external-app interactions |
| `--execute-starter` | boolean | No | Whether to execute the configured starter question on initiation |
| `--active-channel` | option | No | Channel type (Web, Email, Chat, ...) |
| `--active-channel-id` | option | No | Unique ID of the channel |

```bash
pega ai-agents start-conversation MYAGENT --context-id MYORG-WORK\!M-123
```

## assistants

### `pega assistants close-conversation`

Close a GenAI assistant conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |

```bash
pega assistants close-conversation MYASSISTANT --conversation PXCONV-1
```

### `pega assistants get-conversation`

Get details of a single GenAI assistant conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |

```bash
pega assistants get-conversation MYASSISTANT --conversation PXCONV-503025
```

### `pega assistants list-conversations`

List conversations for a GenAI assistant

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--context-id` | option | Yes | Context ID (case or landing-page context) |
| `--page-size` | option | No | Results per page |
| `--page-index` | option | No | Page index (0-based) |

```bash
pega assistants list-conversations MYASSISTANT --context-id MYORG-WORK\!M-123
```

### `pega assistants send-message`

Send a message in a GenAI assistant conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--conversation` | option | Yes | Conversation ID |
| `--request` | option | Yes | User query text |

```bash
pega assistants send-message MYASSISTANT --conversation PXCONV-1 --request "hello"
```

### `pega assistants start-conversation`

Start a new GenAI assistant conversation

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--context-id` | option | No | Context ID (case or landing-page context) |
| `--interaction-id` | option | No | Unique ID for external-app interactions |
| `--execute-starter` | boolean | No | Whether to execute the configured starter question on initiation |

```bash
pega assistants start-conversation MYASSISTANT --context-id MYORG-WORK\!M-123
```

## attachments

### `pega attachments add`

Add attachments to a Pega case (atomic batch POST)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--attachments` | option | Yes | JSON array of attachment objects (inline, @file, or -) |

```bash
pega attachments add MYAPP-CASE-1 --attachments '[{"type":"File","category":"Correspondence","name":"doc.pdf","ID":"att-id-123"}]'
```

### `pega attachments delete`

Delete a Pega attachment by ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega attachments delete ATTACH-ID-1
```

### `pega attachments get`

Get a Pega attachment by ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--output` | option | No | Write attachment content to this file path |

```bash
pega attachments get ATTACH-1
```

### `pega attachments list`

List attachments on a Pega case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--include-thumbnails` | boolean | No | Include thumbnail images in the response |

```bash
pega attachments list MYAPP-CASE-1
```

### `pega attachments patch`

Update attachment metadata (name and/or category)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--name` | option | No | New attachment name |
| `--category` | option | No | New attachment category |

```bash
pega attachments patch ATTACH-ID-1 --name "New Name"
```

### `pega attachments upload`

Upload a file as a Pega attachment (multipart POST)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--file` | option | Yes | Path to the file to upload |
| `--append-unique-id` | boolean | No | Append a unique ID to the uploaded filename |

```bash
pega attachments upload --file ./report.pdf
```

## case-types

### `pega case-types get`

Get full details of a specific case type (filters the case-types list response)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega case-types get Uplus-FS-Work-ProductComplaint
```

### `pega case-types get-action`

Get the creation action/view for a case type

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Action ID |

```bash
pega case-types get-action MYAPP-WORK-CASE --action pyStartCase
```

### `pega case-types list`

List all available case types in the application

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega case-types list
```

### `pega case-types list-bulk-actions`

List bulk actions for a case type (Launchpad only)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega case-types list-bulk-actions Uplus-FS-Work-Loan
```

## data

### `pega data count`

Get count of records in a data view by POSTing to /data_views/{dataViewId}/count

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--params` | option | No | JSON object of data view parameters → dataViewParameters |
| `--data` | option | No | Full request body as JSON (mutually exclusive with --params) |

```bash
pega data count D_MyDataView
```

### `pega data create`

Create a new data record

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--data` | option | Yes | JSON body (inline, @file, or -) |

```bash
pega data create D_MyDataView --data '{"field":"value"}'
```

### `pega data delete`

Delete a data record

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--params` | option | No | JSON object of query parameters identifying the record to delete |

```bash
pega data delete D_MyDataView --params '{"id":101}'
```

### `pega data get`

Get a data view by ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega data get D_MyDataView
```

### `pega data get-action`

Get a specific action for a data record

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Action ID |
| `--data` | option | No | JSON content (inline, @file, or -) |

```bash
pega data get-action D_MyDataView --action myAction
```

### `pega data get-metadata`

Get metadata for a data view by ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega data get-metadata D_MyDataView
```

### `pega data list-actions`

List available actions for a data record

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega data list-actions D_MyDataView
```

### `pega data list-objects`

List all data objects available in the application

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega data list-objects
```

### `pega data list-pages`

List data pages available in the application

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--type` | option | No | Data page request type |

```bash
pega data list-pages
```

### `pega data patch`

Patch a data record (PATCH with eTag)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--data` | option | Yes | JSON body (inline, @file, or -) |

```bash
pega data patch D_MyDataView --data '{"field":"value"}'
```

### `pega data perform-action`

Perform an action on a data record

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--action` | option | Yes | Action ID |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array (inline, @file, or -) |
| `--attachments` | option | No | JSON attachments array (inline, @file, or -) |

```bash
pega data perform-action D_MyDataView --action myAction
```

### `pega data query`

Query a data view by POSTing to /data_views/{dataViewId}

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--params` | option | No | JSON object of data view parameters → dataViewParameters |
| `--max` | option | No | Maximum results to fetch → paging.maxResultsToFetch |
| `--page` | option | No | Page number → paging.pageNumber |
| `--include-total` | boolean | No | Include total count in response → paging.includeTotalCount |
| `--data` | option | No | Full request body as JSON (mutually exclusive with --params/--max/--page/--include-total) |

```bash
pega data query D_MyDataView --max 10 --include-total
```

### `pega data query-metadata`

Get metadata for a data view by POSTing to /data_views/{dataViewId}/metadata

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--params` | option | No | JSON object of data view parameters → dataViewParameters |
| `--data` | option | No | Full request body as JSON (mutually exclusive with --params) |

```bash
pega data query-metadata D_MyDataView
```

### `pega data query-view`

Query a specific view of a data view by POSTing to /data_views/{dataViewId}/views/{viewId}

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--view` | option | Yes | View ID within the data view |
| `--params` | option | No | JSON object of data view parameters → dataViewParameters |
| `--max` | option | No | Maximum results to fetch → paging.maxResultsToFetch |
| `--page` | option | No | Page number → paging.pageNumber |
| `--include-total` | boolean | No | Include total count in response → paging.includeTotalCount |
| `--data` | option | No | Full request body as JSON (mutually exclusive with --params/--max/--page/--include-total) |

```bash
pega data query-view D_MyDataView --view myView
```

### `pega data update`

Update a data record (PUT with eTag)

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--data` | option | Yes | JSON body (inline, @file, or -) |

```bash
pega data update D_MyDataView --data '{"field":"value"}'
```

## documents

### `pega documents delete`

Remove a document linked to a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--document` | option | Yes | Document ID |

```bash
pega documents delete MYAPP-CASE-1 --document DOC-1
```

### `pega documents get`

Get metadata for a specific document

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega documents get DOC-1
```

## followers

### `pega followers add`

Add a follower to a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--user` | option | Yes | User ID |

```bash
pega followers add MYAPP-CASE-1 --user U1
```

### `pega followers delete`

Remove a follower from a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--user` | option | Yes | User ID |

```bash
pega followers delete MYAPP-CASE-1 --user U1
```

### `pega followers list`

List all followers of a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega followers list MYAPP-CASE-1
```

## pages

### `pega pages channel`

Get channel details by channel ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega pages channel MyChannel
```

### `pega pages dashboard`

Get page details for displaying a Dashboard

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega pages dashboard MyDashboard
```

### `pega pages get`

Get page details by page ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--page-class` | option | No | Class in which the page lives (→ ?pageClass=) |

```bash
pega pages get MyPage
```

### `pega pages get-with-context`

Get page details with a data context (POST /pages/{pageID})

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--data-context` | option | Yes | Data context string → request body { dataContext } |

```bash
pega pages get-with-context MyPage --data-context "ContextValue"
```

### `pega pages insight`

Get page details for displaying an Insight

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega pages insight MyInsight
```

### `pega pages localization`

Get locale bundle by locale name

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega pages localization en_US
```

### `pega pages portal`

Get portal details by portal ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega pages portal MyPortal
```

## participants

### `pega participants add`

Add a participant to a case in a given role

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--role` | option | Yes | Participant role ID (e.g. Customer, Owner) |
| `--data` | option | Yes | JSON content page: {pyFirstName,pyLastName,pyEmail1,pyPhoneNumber,...} (inline, @file, or -) |

```bash
pega participants add MYAPP-CASE-1 --role Customer --data '{"pyFirstName":"Jane","pyLastName":"Doe","pyEmail1":"jane@example.com","pyPhoneNumber":""}'
```

### `pega participants delete`

Remove a participant from a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--participant-id` | option | Yes | Participant instance ID |

```bash
pega participants delete MYAPP-CASE-1 --participant-id PEGA-PART-X
```

### `pega participants get`

Get a specific participant by participant ID

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--participant-id` | option | Yes | Participant instance ID |

```bash
pega participants get MYAPP-CASE-1 --participant-id PEGA-PART-X
```

### `pega participants get-role`

Get details of a specific participant role on a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--role-id` | option | Yes | Participant role ID |

```bash
pega participants get-role MYAPP-CASE-1 --role-id Owner
```

### `pega participants list`

List all participants on a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega participants list MYAPP-CASE-1
```

### `pega participants list-roles`

List participant roles configured on a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega participants list-roles MYAPP-CASE-1
```

### `pega participants update`

Update a participant's details

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--participant-id` | option | Yes | Participant instance ID |
| `--data` | option | No | JSON content (inline, @file, or -) |
| `--page-instructions` | option | No | JSON page-instructions array |
| `--attachments` | option | No | JSON attachments array |

```bash
pega participants update MYAPP-CASE-1 --participant-id PEGA-PART-X --data '{"email":"a@b.com"}'
```

## related

### `pega related add`

Add a related case link

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--related-case-id` | option | Yes | Related case ID |
| `--relationship` | option | Yes | Relationship type |

```bash
pega related add MYAPP-CASE-1 --related-case-id MYAPP-CASE-2 --relationship parent
```

### `pega related delete`

Remove a related case link

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--related-case-id` | option | Yes | Related case ID |

```bash
pega related delete MYAPP-CASE-1 --related-case-id MYAPP-CASE-2
```

### `pega related list`

List all related cases

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega related list MYAPP-CASE-1
```

## static-content

### `pega static-content component`

Get a custom component as raw JavaScript

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--output` | option | No | Write component JS to this file path (default: stdout) |

```bash
pega static-content component MyComponent
```

### `pega static-content file`

Get a static file (binary). --output is required.

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--output` | option | Yes | Required: write binary bytes to this file path |

```bash
pega static-content file MyFile --output ./my-file.bin
```

### `pega static-content profile-image`

Get a user profile image

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--output` | option | No | Write image to this file path (default: stdout) |

```bash
pega static-content profile-image user123
```

## tags

### `pega tags add`

Add one or more tags to a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--tag` | option | Yes | Tag name (repeat for multiple) |

```bash
pega tags add MYAPP-CASE-1 --tag urgent
```

### `pega tags delete`

Remove a tag from a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |
| `--tag` | option | Yes | Tag name |

```bash
pega tags delete MYAPP-CASE-1 --tag urgent
```

### `pega tags list`

List all tags on a case

| Flag | Type | Required | Description |
|---|---|---|---|
| `--format` | option | No | Output format (json, compact, yaml, table) |
| `--fields` | option | No | Comma-separated top-level fields to include in output |
| `--dry-run` | boolean | No | Print HTTP request details and exit without executing |
| `--quiet` | boolean | No | Suppress all stderr progress/warning output |
| `--verbose` | boolean | No | Emit full HTTP request/response details to stderr |
| `--no-cache` | boolean | No | Bypass token file cache; perform fresh OAuth exchange |
| `--profile` | option | No | Named config profile |

```bash
pega tags list MYAPP-CASE-1
```
