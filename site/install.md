---
title: Install
description: Install pega-dx-cli from pre-built binary, npm, or source.
---

# Install

`pega-dx-cli` ships in three forms: pre-built platform binaries (recommended for end users), npm package (for Node.js developers), or build-from-source.

## Pre-built binaries

Each release attaches platform-specific tarballs (and a Windows `.zip`) to the [Releases page](https://github.com/pknoetze/pega-dx-cli/releases). Tarballs include a bundled Node runtime — you don't need Node installed.

Filenames are version-agnostic so the `/releases/latest/download/<file>` URL always points at the latest stable release:

| Platform | Asset |
|---|---|
| macOS (Apple Silicon) | `pega-darwin-arm64.tar.gz` |
| macOS (Intel) | `pega-darwin-x64.tar.gz` |
| Linux (x64) | `pega-linux-x64.tar.gz` |
| Linux (arm64) | `pega-linux-arm64.tar.gz` |
| Windows (x64) tarball | `pega-win32-x64.tar.gz` |
| Windows (x64) zip | `pega-win32-x64.zip` |

### Download and extract

::: code-group

```bash [macOS (Apple Silicon)]
curl -LO https://github.com/pknoetze/pega-dx-cli/releases/latest/download/pega-darwin-arm64.tar.gz
tar -xzf pega-darwin-arm64.tar.gz
```

```bash [macOS (Intel)]
curl -LO https://github.com/pknoetze/pega-dx-cli/releases/latest/download/pega-darwin-x64.tar.gz
tar -xzf pega-darwin-x64.tar.gz
```

```bash [Linux (x64)]
curl -LO https://github.com/pknoetze/pega-dx-cli/releases/latest/download/pega-linux-x64.tar.gz
tar -xzf pega-linux-x64.tar.gz
```

```bash [Linux (arm64)]
curl -LO https://github.com/pknoetze/pega-dx-cli/releases/latest/download/pega-linux-arm64.tar.gz
tar -xzf pega-linux-arm64.tar.gz
```

```powershell [Windows]
Invoke-WebRequest -Uri https://github.com/pknoetze/pega-dx-cli/releases/latest/download/pega-win32-x64.zip -OutFile pega-win32-x64.zip
Expand-Archive pega-win32-x64.zip -DestinationPath .
```

:::

### Verifying the download

Each release also ships `SHA256SUMS`. After downloading:

```bash
curl -LO https://github.com/pknoetze/pega-dx-cli/releases/latest/download/SHA256SUMS
sha256sum -c SHA256SUMS --ignore-missing
```

Expected output: `pega-<plat>-<arch>.tar.gz: OK`.

### Adding to PATH

After extracting, symlink or add the binary to a directory on your PATH:

::: code-group

```bash [macOS / Linux]
sudo ln -s "$(pwd)/pega/bin/pega" /usr/local/bin/pega
```

```powershell [Windows]
$extracted = (Resolve-Path .\pega).Path
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$extracted\bin", "User")
```

:::

Open a new shell so the PATH change takes effect on Windows.

### macOS Gatekeeper

The binary is not signed or notarized (planned for a future release). On first run, macOS Gatekeeper blocks unsigned binaries with:

> "pega" cannot be opened because the developer cannot be verified.

Two options to bypass:

1. **Clear the quarantine attribute (one-time):**
   ```bash
   xattr -d com.apple.quarantine ./pega/bin/pega
   ```
   The binary now runs without warnings.

2. **Right-click → Open in Finder** (slower, GUI-only). The system will offer an "Open Anyway" button under System Settings → Privacy & Security.

### Windows SmartScreen

Without a code-signing certificate, Windows SmartScreen flags the binary on first run. Click "More info" → "Run anyway" to proceed.

The `.zip` distribution (rather than `.exe`) reduces this friction — SmartScreen mostly triggers on standalone `.exe` downloads.

### Upgrading

Download the new release tarball and replace your extracted directory. The symlink continues to work.

### Uninstalling

```bash
sudo rm /usr/local/bin/pega
rm -rf /path/to/extracted/pega
```

## npm install

For Node.js developers who already have Node 22 or newer:

```bash
npm install -g pega-dx-cli
```

This installs the same code as the binary releases but uses your system Node rather than the bundled runtime. Smaller install, but you must keep Node up to date yourself.

## From source

For contributors or anyone who wants to run a development build:

```bash
git clone https://github.com/pknoetze/pega-dx-cli.git
cd pega-dx-cli
npm ci
npm run build
npm link
```

`npm link` makes the `pega` command available system-wide and points it at your local checkout. Rebuild (`npm run build`) after pulling new changes.

## Configuration

Configuration is read from environment variables first, falling back to `~/.pega-cli/config.json`. Credentials are never accepted as CLI flags.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PEGA_BASE_URL` | yes | Your Pega instance root URL (no `/prweb`) |
| `PEGA_CLIENT_ID` | yes | OAuth 2.1 client credentials — client ID |
| `PEGA_CLIENT_SECRET` | yes | OAuth 2.1 client credentials — client secret |
| `PEGA_NO_CACHE` | no | Set to `true` to disable token file caching (CI/CD) |

### Config file

`~/.pega-cli/config.json`:

```json
{
  "default": {
    "baseUrl": "https://your-instance.pega.com",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  },
  "staging": {
    "baseUrl": "https://staging.your-instance.pega.com",
    "clientId": "staging-client-id",
    "clientSecret": "staging-client-secret"
  }
}
```

After creating `~/.pega-cli/config.json`, set restrictive permissions: `chmod 0600 ~/.pega-cli/config.json`. The file contains your OAuth client secret.

### Env var precedence

Environment variables (`PEGA_BASE_URL`, `PEGA_CLIENT_ID`, `PEGA_CLIENT_SECRET`) take precedence over config file settings. This makes it easy to override per-profile configuration in scripts or CI/CD workflows.

### Multiple environments

For managing multiple Pega environments (dev, staging, production), see the [Profiles guide](/guides/profiles) for detailed multi-environment configuration patterns.

## Troubleshooting

### Diagnostic tool

Run `pega auth diagnose` to identify configuration and connectivity issues. The tool checks four things:

| Check | What it verifies | How to fix |
|---|---|---|
| `baseUrl` | Your Pega instance is reachable | Set `PEGA_BASE_URL` (without `/prweb`) in your environment or config file |
| `credentials` | OAuth client ID and secret are configured | Set `PEGA_CLIENT_ID` and `PEGA_CLIENT_SECRET` |
| `oauth` | The OAuth 2.0 service rule is enabled in your instance | Verify client credentials in Pega Infinity admin; check that the OAuth 2.0 service rule is enabled |
| `apiV2` | The Constellation DX API (V2) is enabled | Confirm your instance has the Constellation DX API (V2) enabled; check network reachability |

### Common errors

- `UNAUTHORIZED (401)` — credentials invalid or token expired. Run `pega auth login` to acquire a fresh token.
- `NOT_FOUND (404)` — the case or assignment ID does not exist. Check the full handle and verify the ID format.
- `PRECONDITION_FAILED (412)` — eTag mismatch on `assignments perform`. The assignment changed between the eTag fetch and the PATCH; retry the command.
- `VALIDATION_FAIL (422)` — Pega rejected the payload. Inspect `--data` contents for required fields and correct types.
- `RATE_LIMITED (429)` — Pega is throttling your requests. Back off exponentially and retry.

## Next steps

Once installed, follow the [Quick Start](/quick-start) to configure credentials and run your first command.
