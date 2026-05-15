# Installing pega-dx-cli

`pega-dx-cli` ships in three forms: pre-built platform binaries (recommended for end users), npm package (for Node.js developers), or build-from-source. This guide walks each path in detail and covers common friction.

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

### Verifying the download

Each release also ships `SHA256SUMS`. After downloading:

```bash
curl -LO https://github.com/pknoetze/pega-dx-cli/releases/latest/download/SHA256SUMS
sha256sum -c SHA256SUMS --ignore-missing
```

Expected output: `pega-<plat>-<arch>.tar.gz: OK`.

### macOS Gatekeeper

The binary is not signed or notarized (planned for a future release). On first run, macOS Gatekeeper blocks unsigned binaries with:

> "pega" cannot be opened because the developer cannot be verified.

Two options to bypass:

1. **Clear the quarantine attribute (one-time):**
   ```bash
   xattr -d com.apple.quarantine ./pega/bin/pega
   ```
   The binary now runs without warnings.

2. **Right-click → Open in Finder** (slower, GUI-only). System will offer an "Open Anyway" button under System Settings → Privacy & Security.

This warning exists for any unsigned binary on macOS — it's not specific to pega-dx-cli.

### Windows SmartScreen

Similar story on Windows: without a code-signing certificate, Windows SmartScreen flags the binary on first run. Click "More info" → "Run anyway" to proceed.

The `.zip` distribution (rather than `.exe`) reduces this friction — SmartScreen mostly triggers on standalone `.exe` downloads.

### Adding to PATH

After extracting, symlink the binary into a directory already on your PATH:

- **macOS/Linux:** `sudo ln -s "$(pwd)/pega/bin/pega" /usr/local/bin/pega`
- **Windows (PowerShell, persistent):**
  ```powershell
  $extracted = (Resolve-Path .\pega).Path
  [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$extracted\bin", "User")
  ```
  Open a new shell so the PATH change takes effect.

### Upgrading

Download the new release tarball, replace your extracted directory. The symlink continues to work.

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

After install, see the README's "Configuration" section for environment variables and `~/.pega-cli/config.json` setup.
