![Pega DX CLI](https://raw.githubusercontent.com/pknoetze/pega-dx-cli/main/pega-dx-cli.png)

# Pega DX CLI

[![Documentation](https://img.shields.io/badge/docs-pknoetze.github.io%2Fpega--dx--cli-purple)](https://pknoetze.github.io/pega-dx-cli/)
[![Pega Infinity](https://img.shields.io/badge/Pega_Infinity-25%2B-blue.svg)](https://www.pega.com/)
[![npm](https://img.shields.io/npm/v/pega-dx-cli)](https://www.npmjs.com/package/pega-dx-cli)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

Developer-first command-line interface for the Pega Infinity™ DX API v2 (Constellation).
Built for both humans at the terminal and LLM coding agents. **v1.0.0 covers Pega DX API v25.1.2.**

📚 **Documentation:** https://pknoetze.github.io/pega-dx-cli/
📖 **Pega DX API reference:** https://docs.pega.com/bundle/dx-api/page/platform/dx-api/dx-api-version-2-con.html

## Experimental

The Pega DX CLI is an experimental project exploring the use of a CLI to interact with the Pega Infinity&trade; DX API endpoints. This is not an official Pegasystems product and is not generally available. All commands, parameters, and other features are subject to change or deprecation at any time, with or without notice. Do not use this CLI in a production environment. We welcome feedback and contributions to help shape the future of this repository.


## Install

```bash
npm install -g pega-dx-cli   # Node 22+
```

Pre-built binaries (macOS, Linux, Windows) and from-source builds: see [Install](https://pknoetze.github.io/pega-dx-cli/install).

## Quick start

```bash
export PEGA_BASE_URL=https://your-instance.pega.com
export PEGA_CLIENT_ID=...
export PEGA_CLIENT_SECRET=...

pega auth login
pega cases get MYAPP-CASE-1
```

Full walkthrough: [Quick Start](https://pknoetze.github.io/pega-dx-cli/quick-start).

## Agent skill (for LLM coding agents)

`pega-dx-cli` ships with an Anthropic-format agent skill that teaches Claude Code,
Cursor, Continue, Windsurf, and other agents how to use the CLI to work with
Pega DX:

```bash
pega skill install                          # Claude Code (default)
pega skill install --target cursor          # or: continue, windsurf, claude-project, agents-md, dir
pega skill list                             # show all targets and resolved paths
```

Details: [Agent Skill guide](https://pknoetze.github.io/pega-dx-cli/guides/agent-skill).

## What's covered

90+ commands across 17 topics (cases, assignments, case-types, attachments, data views, AI agents, social, …).

- Full coverage matrix: [API Coverage](https://pknoetze.github.io/pega-dx-cli/api-coverage).
- Per-topic command reference: [Commands](https://pknoetze.github.io/pega-dx-cli/commands/).

## Contributing

Bugs and feature requests: [Issues](https://github.com/pknoetze/pega-dx-cli/issues). PRs welcome — validate locally with:

```bash
npm ci && npm run build && NODE_OPTIONS=--experimental-vm-modules npm test
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
