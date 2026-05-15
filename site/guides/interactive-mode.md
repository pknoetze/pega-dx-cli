---
title: Interactive Mode
description: Walk through assignment actions step-by-step using the interactive wizard.
---

# Interactive Mode

The `assignments perform` command accepts a `--interactive` flag that walks you through performing an assignment action via prompts:

```bash
pega assignments perform ASSIGN-1 --interactive
```

## How the wizard works

The wizard runs four steps:

1. Fetches the assignment and lists its available actions.
2. Lets you pick one.
3. Fetches the action's view and prompts for each required field.
4. Shows a summary and asks for confirmation before submitting.

## Constraints

`--interactive` is mutually exclusive with `--action`, `--data`, `--page-instructions`, `--attachments`, and `--dry-run`. If stdin is not a TTY the flag is ignored (with a warning on stderr) and the existing non-interactive behavior runs unchanged.

## Unsupported field types

For fields whose type the wizard can't map automatically (dropdowns, picklists, page lists, etc.), the prompt label is annotated with the original Pega type and accepts a freeform value. If the action's view shape isn't recognized at all, the wizard exits with `INVALID_ARGS` and recommends `--data`.

## Piping-friendly

Even in interactive mode, the final PATCH response is the only thing written to stdout — all prompts, summaries, and progress messages go to stderr. This means the output is still safe to pipe:

```bash
pega assignments perform ASSIGN-1 --interactive | jq
```

See [Piping & scripting](/guides/piping-scripting) for more on combining `pega` with other tools.
