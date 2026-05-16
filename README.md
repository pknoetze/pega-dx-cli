# pega-dx-cli

[![npm](https://img.shields.io/npm/v/pega-dx-cli)](https://www.npmjs.com/package/pega-dx-cli)
[![Documentation](https://img.shields.io/badge/docs-pknoetze.github.io%2Fpega--dx--cli-blue)](https://pknoetze.github.io/pega-dx-cli/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Developer-first command-line interface for the Pega Infinity™ DX API v2 (Constellation).
Built for both humans at the terminal and LLM coding agents. **v1.0.0 covers Pega DX API v25.1.2.**

📚 **Documentation:** https://pknoetze.github.io/pega-dx-cli/
📖 **Pega DX API reference:** https://docs.pega.com/bundle/dx-api/page/platform/dx-api/dx-api-version-2-con.html

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

Bugs and feature requests: [Issues](https://github.com/pknoetze/pega-dx-cli/issues). See [CONTRIBUTING.md](CONTRIBUTING.md) if it exists, otherwise open a PR — `npm ci && npm run build && NODE_OPTIONS=--experimental-vm-modules npm test` to validate locally.

## License

MIT — see [LICENSE](LICENSE).
