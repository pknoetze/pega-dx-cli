# Global Flags

Every `pega` command accepts these global flags to control output, behavior, authentication, and debugging.

## Flag Reference

| Flag | Default | Description |
|---|---|---|
| `--format` | `json` | Output format: `json`, `compact`, `yaml`, or `table` |
| `--fields` | — | Comma-separated top-level fields to include in output |
| `--dry-run` | `false` | Print the redacted HTTP request to stdout and exit 0 (no API call) |
| `--quiet` | `false` | Suppress progress and warning messages on stderr (structured errors still emit) |
| `--verbose` | `false` | Emit HTTP request/response summaries to stderr for debugging |
| `--no-cache` | `false` | Bypass token cache; perform fresh OAuth exchange on every invocation |
| `--profile` | `default` | Select a named profile from the config file (`~/.pega-cli/config.json`) |

## Output Formats

### `--format json` (default)

Pretty-printed JSON output. Human-readable and suitable for piping to `jq`.

```bash
pega cases get CASE-123

# Output:
{
  "id": "CASE-123",
  "status": "Open",
  "type": "Claim"
}
```

### `--format compact`

Minified JSON on a single line. Useful for shell pipelines where size matters.

```bash
pega cases get CASE-123 --format compact | jq '.id'

# Output: "CASE-123"
```

### `--format yaml`

YAML format, useful for human reading, diffs, and integration with tools that expect YAML.

```bash
pega cases get CASE-123 --format yaml

# Output:
id: CASE-123
status: Open
type: Claim
```

### `--format table`

Human-readable table for terminal browsing. Falls back to JSON when the response shape cannot be tabulated (e.g., deeply nested or irregular objects).

```bash
pega cases get CASE-123 --format table

# Output:
ID         | Status | Type
-----------|--------|--------
CASE-123   | Open   | Claim
```

## Filtering with `--fields`

The `--fields` flag filters to specific top-level keys before serialization. Works with all four output formats.

```bash
# Include only the id and status fields
pega cases get CASE-123 --fields id,status

# Output:
{
  "id": "CASE-123",
  "status": "Open"
}
```

## `--data` Input Forms

The `--data` flag accepts JSON payloads in three forms:

### Inline JSON

Pass JSON directly as a command argument:

```bash
pega cases create --type Claim --data '{"claimAmount":1000,"claimType":"Auto"}'
```

### File Reference

Reference a JSON file using the `@` prefix:

```bash
pega cases create --type Claim --data @claim.json
```

### Stdin

Pipe JSON from stdin using `-`:

```bash
cat claim.json | pega cases create --type Claim --data -
```

## Dry Run Mode

The `--dry-run` flag prints the HTTP request that would be sent to the API (with credentials redacted) and exits with code 0, without making the actual API call. This is useful for debugging or previewing commands before executing them.

```bash
pega cases get CASE-123 --dry-run

# Output to stdout:
POST /dx-api/v2/cases/CASE-123
Host: your-instance.pega.com
Authorization: Bearer [REDACTED]
Content-Type: application/json

{}
```

## Verbose Debugging

The `--verbose` flag emits HTTP request and response summaries to stderr, useful for debugging authentication or API issues.

```bash
pega cases get CASE-123 --verbose 2>&1 | head -20

# stderr output:
[HTTP] GET /dx-api/v2/cases/CASE-123 200 OK (145ms)
[HTTP] Response: {"id":"CASE-123",...}
```

## Quiet Mode

The `--quiet` flag suppresses progress and warning messages on stderr. Structured errors are still emitted.

```bash
pega cases get CASE-123 --quiet

# No progress output on stderr, only the JSON response on stdout
```

## Token Cache

By default, OAuth tokens are cached in `~/.pega-cli/` to avoid repeated authentication. Each profile has its own token file:

- `~/.pega-cli/token.default.json` — default profile
- `~/.pega-cli/token.staging.json` — staging profile
- etc.

### Bypass the Cache

Use `--no-cache` to skip the cache and perform a fresh OAuth exchange. Essential for CI/CD pipelines.

```bash
export PEGA_BASE_URL=https://your-instance.pega.com
export PEGA_CLIENT_ID=${{ secrets.PEGA_CLIENT_ID }}
export PEGA_CLIENT_SECRET=${{ secrets.PEGA_CLIENT_SECRET }}

pega cases get MYAPP-CASE-1 --no-cache | jq '.status'
```

Or set the environment variable `PEGA_NO_CACHE=true` to disable caching globally:

```bash
export PEGA_NO_CACHE=true
pega cases get MYAPP-CASE-1
```

## Profile Selection

Use `--profile <name>` to switch between named Pega environments defined in `~/.pega-cli/config.json`. Environment variables still take precedence.

```bash
# Authenticate the staging profile
pega auth login --profile staging

# Run a command against staging
pega cases get CASE-123 --profile staging
```

See [Profiles](../guides/profiles.md) for detailed setup instructions.

## Combining Flags

Flags can be combined as needed:

```bash
# Get a case in YAML format, showing only id and status, verbosely
pega cases get CASE-123 --format yaml --fields id,status --verbose

# Create a case with a dry run and quiet output
pega cases create --type Claim --data @claim.json --dry-run --quiet
```
