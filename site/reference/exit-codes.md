# Exit Codes

`pega-dx-cli` uses standard exit codes to indicate success or failure. Scripts and CI/CD pipelines should check the exit code to determine if a command succeeded.

## Exit Code Reference

| Code | Meaning | Examples |
|---|---|---|
| 0 | Success | Command completed successfully, including clean user cancellation (Ctrl+C in interactive mode) |
| 1 | API or runtime error | Network timeout, HTTP 4xx/5xx response, connectivity failure |
| 2 | Invalid arguments or configuration | Malformed CLI arguments, bad config file, missing required credentials |
| 130 | User interruption | Ctrl+C pressed during interactive mode |

## Success (0)

The command completed successfully and returned the expected result.

```bash
pega cases get CASE-123
echo $?
# Output: 0
```

Clean cancellation in interactive mode also exits with 0:

```bash
pega assignments perform ASSIGN-1 --interactive
# User cancels at a prompt with Ctrl+C
echo $?
# Output: 0
```

## API or Runtime Error (1)

An error occurred during API communication or execution. This includes:

- HTTP errors (4xx, 5xx)
- Network timeouts or connection failures
- Unexpected runtime failures

```bash
pega cases get NONEXISTENT-CASE
# Output (stderr): Error: NOT_FOUND (404)
echo $?
# Output: 1

pega cases get CASE-123 --dry-run
# Network timeout occurs
echo $?
# Output: 1
```

## Invalid Arguments or Configuration (2)

The command-line arguments are malformed, or the configuration is incomplete or incorrect. This includes:

- Missing required arguments
- Unknown flags
- Invalid argument values
- Config file errors (bad JSON, missing credentials)
- Parsing failures

Examples:

```bash
pega cases get
# Missing required argument: caseId
echo $?
# Output: 2

pega cases get CASE-123 --unknown-flag
# Unknown flag
echo $?
# Output: 2

pega cases get CASE-123 --profile nonexistent
# Profile not found in ~/.pega-cli/config.json
echo $?
# Output: 2

pega auth ping
# PEGA_BASE_URL not set (missing required config)
echo $?
# Output: 2
```

## User Interruption (130)

The user pressed Ctrl+C during an interactive command (e.g., interactive mode for assignments).

```bash
pega assignments perform ASSIGN-1 --interactive
# User presses Ctrl+C at a prompt
echo $?
# Output: 130
```

## Error Code Distinctions

The CLI distinguishes between three categories of errors:

### `INVALID_CONFIG`

Configuration is missing or malformed:
- Environment variables not set (`PEGA_BASE_URL`, `PEGA_CLIENT_ID`, `PEGA_CLIENT_SECRET`)
- Config file (`~/.pega-cli/config.json`) is not valid JSON
- Named profile not found in config file
- Config file has incorrect structure

Exit code: **2**

### `INVALID_ARGS`

CLI arguments are invalid:
- Required argument missing
- Unknown flag
- Invalid flag value
- Incompatible flag combination (e.g., `--interactive` with `--data`)
- oclif parser failure

Exit code: **2**

### API or Network Failure

The API request failed:
- HTTP 4xx error (bad request, not found, conflict, etc.)
- HTTP 5xx error (server error)
- Network timeout or connection refused
- Unexpected runtime error

Exit code: **1**

## Using Exit Codes in Scripts

Check the exit code to handle errors in shell scripts:

```bash
#!/bin/bash

# Fetch a case and exit if it fails
pega cases get "$CASE_ID" || exit 1

# Process the case further
echo "Case fetched successfully"
```

Or distinguish between error types:

```bash
#!/bin/bash

pega cases get "$CASE_ID"
STATUS=$?

case $STATUS in
  0)
    echo "Success"
    ;;
  1)
    echo "API error — check connectivity"
    exit 1
    ;;
  2)
    echo "Invalid arguments or configuration"
    exit 2
    ;;
  *)
    echo "Unknown error"
    exit 1
    ;;
esac
```

## CI/CD Integration

In CI environments, always check exit codes:

```bash
#!/bin/bash
set -e  # Exit on first error

export PEGA_BASE_URL="https://your-instance.pega.com"
export PEGA_CLIENT_ID="${PEGA_CLIENT_ID}"
export PEGA_CLIENT_SECRET="${PEGA_CLIENT_SECRET}"
export PEGA_NO_CACHE=true

# These commands will exit the script on any error
pega auth ping
pega cases get "$CASE_ID" | jq '.status'
```

Or explicitly handle errors:

```bash
#!/bin/bash

if pega auth ping --no-cache; then
  echo "Authentication successful"
  pega cases get "$CASE_ID"
else
  echo "Authentication failed"
  exit 1
fi
```
