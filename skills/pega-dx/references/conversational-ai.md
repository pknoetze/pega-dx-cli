# Pega Conversational AI — When to read this

Read this reference when the user wants to interact with Pega AI agents
or assistants. For auth details, read concepts.md.

## Table of contents

1. Agent ID composition and shell-quoting
2. ai-agents lifecycle (start → send → close)
3. Feedback (like / dislike)
4. assistants vs ai-agents differences
5. Context IDs and shell-quoting

## 1. Agent ID composition and shell-quoting

Pega AI agents are identified by **`{agentClass}!{name}`** — the class
the agent lives in, a literal `!`, then the agent's `name`. Both come
from `pega ai-agents list`:

```bash
pega ai-agents list --format json \
  | jq -r '.[] | .agentClass + "!" + .name'
# e.g. "@baseclass!MyAgent"
```

The `!` is shell-special: bash with history-expansion treats an
unquoted `!` as a history reference. **Single-quote** any agent ID in
bash (zsh's default is more forgiving but quoting still works). For
double quotes (variable expansion), backslash-escape the `!`:

```bash
pega ai-agents start-conversation '@baseclass!MyAgent'

AGENT='@baseclass!MyAgent'
pega ai-agents start-conversation "$AGENT" --context-id MYORG-WORK\!M-1
```

## 2. ai-agents lifecycle (start → send → close)

The pattern is three calls, with a **conversation ID** threaded through
them. Capture the ID with `jq` after `start-conversation` and reuse it
on every follow-up:

```bash
# Pick an agent
AGENT=$(pega ai-agents list --format json \
  | jq -r '.[0] | .agentClass + "!" + .name')

# Start a conversation, capture its ID
CONV=$(pega ai-agents start-conversation "$AGENT" \
  --context-id MYORG-WORK\!M-123 \
  --format json | jq -r .ID)

# Send a turn — the response contains the agent's reply
pega ai-agents send-message "$AGENT" --conversation "$CONV" \
  --request "What's the balance on this case?"

# Close when done so resources are released
pega ai-agents close-conversation "$AGENT" --conversation "$CONV"
```

Flags worth knowing:

- `--context-id <id>` on `start-conversation` — a case handle or
  landing-page context that scopes the conversation. Required for
  `list-conversations`, recommended for `start-conversation`.
- `--no-execute-starter` — skip the agent's configured starter question.
- `--active-channel <Web|Email|Chat|...>` / `--active-channel-id <id>` —
  declare the surface channel; routes to channel-specific Pulse feeds.
- `--attachments @file.json` on `send-message` — attach files/URLs to
  the user's turn. Same element shape as `attachments add`
  (`[{type, ID, category, name, ...}]`).

Inspect mid-stream with `pega ai-agents get-conversation $AGENT
--conversation $CONV`, or page history with `pega ai-agents
list-conversations $AGENT --context-id <ctx> --page-size 20
--page-index 0`.

## 3. Feedback (like / dislike)

Both feedback verbs target a **message ID** within an active
conversation. `dislike` additionally requires free-text feedback that
becomes the `feedbackText` body field:

```bash
# Like
pega ai-agents like "$AGENT" --conversation "$CONV" --message MSG-1

# Dislike — feedback is required, not optional
pega ai-agents dislike "$AGENT" --conversation "$CONV" --message MSG-1 \
  --feedback "Off topic, didn't answer the question"
```

The CLI handles the URL composition; you do not need to know the path
layout (`/messages/{messageID}/like` etc.).

## 4. assistants vs ai-agents differences

The `assistants` group mirrors `ai-agents` for GenAI assistants and uses
the same verb names — `list-conversations`, `start-conversation`,
`get-conversation`, `send-message`, `close-conversation`:

```bash
CONV=$(pega assistants start-conversation MyAssistant \
  --context-id MYORG-WORK\!M-123 --format json | jq -r .ID)
pega assistants send-message MyAssistant --conversation "$CONV" --request "Hello"
pega assistants close-conversation MyAssistant --conversation "$CONV"
```

Key surface differences:

- **No `--attachments` on `assistants send-message`** — text-only on the
  wire; the body just carries `Request`.
- **No `--active-channel` / `--active-channel-id` on
  `assistants start-conversation`** — no `activeChannel*` body fields.
- **No `like` / `dislike` commands** — no per-message feedback surface.
  Use `ai-agents` if you need it.

Reach for `assistants` when you want a lightweight GenAI chat, and
`ai-agents` when you need attachments, channel metadata, or feedback.

## 5. Context IDs and shell-quoting

Pega context IDs are usually case handles such as `MYORG-WORK!M-123` —
that embedded `!` will bite you in bash. Either single-quote the whole
value or escape the bang:

```bash
# Single-quote (preferred, works in both bash and zsh)
pega ai-agents list-conversations '@baseclass!MyAgent' \
  --context-id 'MYORG-WORK!M-123'

# Or escape with backslash inside double quotes
pega ai-agents list-conversations "@baseclass!MyAgent" \
  --context-id MYORG-WORK\!M-123
```

The same rule applies to assignment handles (`X-1!FLOW`) anywhere on
the command line. A confusing "event not found" error means the shell
ate your `!` — re-quote and retry.
