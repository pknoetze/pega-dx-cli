---
title: Agent Skill
description: Install the pega-dx agent skill so your coding agent knows how to use the pega CLI.
---

# Agent Skill

The pega-dx CLI ships with an Anthropic-format agent skill that teaches LLM
coding agents how to use the `pega` CLI to work with the Pega DX API v2
(Constellation).

## Prerequisites

`pega` must be installed — see [Install](/install).

## Install for your tool

::: code-group

```bash [Claude Code (user)]
pega skill install
```

```bash [Claude Code (project)]
pega skill install --target claude-project
```

```bash [Cursor]
pega skill install --target cursor
```

```bash [Continue]
pega skill install --target continue
```

```bash [Windsurf]
pega skill install --target windsurf
```

```bash [AGENTS.md]
pega skill install --target agents-md
```

```bash [Custom directory]
pega skill install --target dir --dest ./skills/pega-dx
```

:::

## What the skill teaches

- The CLI contract (JSON on stdout, progress on stderr; `--format`, `--fields`, `--dry-run`).
- OAuth + profile model; when to set env vars vs. `~/.pega-cli/config.json`.
- The Pega DX mental model: case → assignment → action → view → stage, eTags, page-instructions, embedded pages under `data.caseInfo.content`.
- Six end-to-end recipes — fetching a case, walking an assignment, paging a data view, AI agent chat round-trips, bulk actions.
- Per-topic detail in `references/`: cases, data views, attachments, conversational AI, social/collab.

## Before / after example

Without the skill, an agent asked to "approve case CASE-1" might call the REST endpoint directly or chain incorrect commands. With the skill loaded, the agent reaches for `pega cases perform-action CASE-1 --action Approve --data '...'`, knows the response is JSON-on-stdout, and handles eTags correctly when mutating.

## Inspecting without installing

```bash
pega skill list                       # what targets exist, where each would write
pega skill show                       # print SKILL.md body
pega skill show case-lifecycle        # print a single reference
```

## Updating

The skill version tracks the CLI version. After upgrading `pega-dx-cli`, re-run:

```bash
pega skill install --force
```

## Authoring / extending

The skill source lives in the [`skills/pega-dx/`](https://github.com/pknoetze/pega-dx-cli/tree/main/skills/pega-dx) directory of the repo. Best practices for authoring new agent skills: [anthropic/skills/skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md).

The canonical Pega DX API reference (used by the skill's `Where to look next` section): [docs.pega.com — DX API v2](https://docs.pega.com/bundle/dx-api/page/platform/dx-api/dx-api-version-2-con.html).

## Troubleshooting

- **"destination already exists"** — pass `--force` to overwrite.
- **Agent doesn't seem to pick up the skill** — run `pega skill list` to check the exact destination path and confirm your tool reads from that location. Different tools expect different filenames; the target list in `pega skill list` matches each tool's expected path.
- **AGENTS.md got merged twice** — re-run `pega skill install --target agents-md --force` to replace the section in place.
