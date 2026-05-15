---
title: Piping & Scripting
description: Use pega-dx-cli in shell pipelines and automation scripts.
---

# Piping & Scripting

Every command prints structured JSON to stdout and progress/warnings to stderr. This makes `pega` safe to use in pipelines:

```bash
pega cases get CASE-1 | jq '.id'
pega assignments perform ASSIGN-1 --action Submit --data @form.json > result.json
```

## Interactive mode in pipelines

Even in interactive mode, the final PATCH response is the only thing written to stdout — all prompts, summaries, and progress messages go to stderr. So this works:

```bash
pega assignments perform ASSIGN-1 --interactive | jq
```

## Suppressing progress output

Use `--quiet` to suppress stderr progress messages. Inquirer prompts in interactive mode are not suppressed by `--quiet` — they're user input, not progress chatter.

```bash
pega cases get CASE-1 --quiet | jq '.status'
```

## Exit codes

Scripts can rely on the following exit codes for error handling:

| Code | Meaning |
|---|---|
| 0 | success (including clean cancellation in interactive mode) |
| 1 | API/network error (HTTP 4xx/5xx, timeout, network failure) |
| 2 | invalid configuration or arguments |
| 130 | interrupted (Ctrl+C in interactive mode) |

## Example: batch processing

```bash
#!/usr/bin/env bash
set -euo pipefail

# Fetch multiple cases and extract their statuses
for case_id in MYAPP-1 MYAPP-2 MYAPP-3; do
  status=$(pega cases get "$case_id" --quiet | jq -r '.status')
  echo "$case_id: $status"
done
```

The script exits immediately on a non-zero exit code (exit code 1 or 2) thanks to `set -e`.
