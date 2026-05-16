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
