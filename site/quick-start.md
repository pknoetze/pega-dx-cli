---
title: Quick Start
description: Configure pega-dx-cli and run your first command in under five minutes.
---

# Quick Start

After [installing](/install), set your Pega credentials and run your first command.

## 1. Configure credentials

Set environment variables (or use a `~/.pega-cli/config.json` file — see [Profiles](/guides/profiles)):

```bash
export PEGA_BASE_URL=https://your-instance.pega.com
export PEGA_CLIENT_ID=your-client-id
export PEGA_CLIENT_SECRET=your-client-secret
```

## 2. Authenticate and ping

```bash
pega auth login
pega auth ping
```

Expected: `auth ping` returns `200 OK` (or similar).

## 3. Run your first command

```bash
pega cases get MYAPP-CASE-1
```

The output is JSON on stdout. Pipe to `jq` for filtering:

```bash
pega cases get MYAPP-CASE-1 | jq '.status'
```

## Next steps

- Manage multiple Pega environments with [Profiles](/guides/profiles).
- Walk an assignment with [Interactive mode](/guides/interactive-mode).
- Compose pipelines with [Piping & scripting](/guides/piping-scripting).
- Browse [all commands](/commands/) or the [API coverage matrix](/api-coverage).
