---
title: Profiles
description: Use named profiles to switch between Pega environments.
---

# Profiles

Use `--profile <name>` to switch between Pega environments. The CLI looks up the named block in `~/.pega-cli/config.json`. Environment variables (`PEGA_BASE_URL`, `PEGA_CLIENT_ID`, `PEGA_CLIENT_SECRET`) still take precedence over file config.

## Using profiles

```bash
# Authenticate the staging profile
pega auth login --profile staging

# Run a command against staging
pega cases get CASE-123 --profile staging
```

## config.json structure

Named profiles are defined in `~/.pega-cli/config.json`:

```json
{
  "default": {
    "baseUrl": "https://prod.pega.com",
    "clientId": "prod-client-id",
    "clientSecret": "prod-client-secret"
  },
  "staging": {
    "baseUrl": "https://staging.pega.com",
    "clientId": "staging-client-id",
    "clientSecret": "staging-client-secret"
  }
}
```

## Token caching

The token cache is namespaced per profile:

- `~/.pega-cli/token.default.json`
- `~/.pega-cli/token.staging.json`

Each file is created with mode `0600` on Unix to keep it owner-readable only.

If you have a legacy `~/.pega-cli/token.json` from before Phase 2a, it is ignored by the CLI and safe to delete.

## Environment variable precedence

Environment variables always take precedence over `config.json` values:

| Source | Precedence |
|---|---|
| `PEGA_BASE_URL`, `PEGA_CLIENT_ID`, `PEGA_CLIENT_SECRET` | Highest — overrides everything |
| Named profile in `~/.pega-cli/config.json` | Used when env vars are absent |
| `default` profile in `~/.pega-cli/config.json` | Fallback |
