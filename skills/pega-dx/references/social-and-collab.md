# Pega Social & Collaboration — When to read this

Read this reference when the user needs to manage tags, followers,
related cases, participants, social feed entries, recent items, UI lists,
content pages, static content, or user settings. For auth details, read
concepts.md.

## Table of contents

1. Tags
2. Followers
3. Related cases
4. Participants
5. Social feed (Pega Pulse)
6. Recents
7. UI lists
8. Pages (content pages)
9. Static content
10. User settings

## 1. Tags

Free-form labels on a case — visible to anyone with case access,
searchable in Pulse. `--tag` is repeatable on `add`:

```bash
pega tags list   MYAPP-CASE-1
pega tags add    MYAPP-CASE-1 --tag urgent --tag review
pega tags delete MYAPP-CASE-1 --tag urgent
```

Tag names are case-insensitive server-side but echo back in original
casing.

## 2. Followers

Operators who receive Pulse notifications on case changes.

```bash
pega followers list   MYAPP-CASE-1
pega followers add    MYAPP-CASE-1 --user U1
pega followers delete MYAPP-CASE-1 --user U1
```

`--user` is the operator ID (`pyUserIdentifier`, e.g. `jane@acme.com`
or `OP-1234`). Discover valid IDs via your app's operator data view.

## 3. Related cases

Directional case-to-case links (`parent`, `child`, `duplicate`, or any
application-defined relationship).

```bash
pega related list   MYAPP-CASE-1
pega related add    MYAPP-CASE-1 --related-case-id MYAPP-CASE-2 --relationship parent
pega related delete MYAPP-CASE-1 --related-case-id MYAPP-CASE-2
```

Allowed `--relationship` values come from the case-type rule; inspect
`pega related list` output on an already-linked case for examples.

## 4. Participants

Participants are people attached to a case in a role (`Customer`,
`Owner`, `Reviewer`, etc.). Each participant has a **participant
instance ID** like `PEGA-PART-X` distinct from the **role ID**.

```bash
# List participants and configured roles
pega participants list       MYAPP-CASE-1
pega participants list-roles MYAPP-CASE-1

# Inspect one participant by instance ID, or one role definition by ID
pega participants get      MYAPP-CASE-1 --participant-id PEGA-PART-X
pega participants get-role MYAPP-CASE-1 --role-id Customer

# Add (PATCH, eTag fetched automatically)
pega participants add MYAPP-CASE-1 --role Customer \
  --data '{"pyFirstName":"Jane","pyLastName":"Doe","pyEmail1":"jane@example.com"}'

# Update or delete by participant instance ID
pega participants update MYAPP-CASE-1 --participant-id PEGA-PART-X \
  --data '{"pyEmail1":"j.doe@example.com"}'
pega participants delete MYAPP-CASE-1 --participant-id PEGA-PART-X
```

`participants update` accepts the full action body: `--data` (content),
`--page-instructions` (list edits), `--attachments` (file/URL links).
Both `add` and `update` fetch the case eTag automatically and send
`If-Match`.

> **Gotcha (0.4.0 migration):** Pre-0.4.0, `get`/`update`/`delete` took
> the role name positionally (`pega participants get CASE-1 Customer`).
> From 0.4.0 the second URL segment is the **participant instance ID**,
> passed via the **`--participant-id`** flag. The role surface moved to
> `participants list-roles` and `participants get-role --role-id <id>`.
> A 404 on a previously-working call usually means a stale role-name
> argument; switch to the instance ID.

## 5. Social feed (Pega Pulse)

The `social` group wraps Pega Pulse — comments, mentions, ad-hoc
collaboration on case contexts.

```bash
# Post / edit / fetch / delete a message
pega social post-message   --context 'MYORG-WORK!M-1' --message "Status update"
pega social get-message    MSG-1
pega social update-message MSG-1 --message "Edited text"
pega social delete-message MSG-1

# List messages or a configured feed for a context
pega social list-messages --filter-by Pulse --filter-for 'MYORG-WORK!M-1'
pega social get-feed      MyFeed --filter-for 'MYORG-WORK!M-1' --page-size 20

# Likes
pega social like-message   MSG-1
pega social unlike-message MSG-1
pega social list-likes     MSG-1

# Mention/message-type/tag discovery
pega social list-mention-types
pega social list-mentions       --mentions-type Operators --search-for jdoe
pega social get-message-type    Pulse-Post
pega social list-suggested-tags --context 'MYORG-WORK!M-1'
pega social search-tags         --search-for security --list-size 20
```

These are Pulse-side counterparts to `pega tags` (case tags, not Pulse
tags). Always single-quote contexts containing `!`.

## 6. Recents

The operator's recently-accessed items — useful for "resume where I
left off" flows.

```bash
pega recents list
pega recents list --max-results 20

# Push or refresh an entry (e.g. after opening a case in a script)
pega recents update --label "Claim C-1" --id 'MYORG-WORK!M-1'
```

`--max-results` takes any positive integer; `0`/negative asks for all.
`update` maps `--label`/`--id` to body fields `pyLabel`/`pyID`.

## 7. UI lists

Personalized table views on landing pages and worklists. The CLI
exposes the **personalization** sub-resource (saved views per
operator) plus a record-reorder endpoint.

```bash
pega ui-lists list-personalizations   LIST-1
pega ui-lists create-personalization  LIST-1 --name "My View"
pega ui-lists update-personalization  LIST-1 PERS-1 --name "Renamed"
pega ui-lists delete-personalization  LIST-1 PERS-1

# Drag-and-drop a record server-side
pega ui-lists move MyListView --source-id R-1 --destination-id R-2
```

`create-personalization` / `update-personalization` accept
`--personalization-state` (opaque verbatim string) and
`--mark-as-default` / `--mark-as-app-default`.

## 8. Pages (content pages)

Application-level content pages: portal, dashboard, insight, channel,
locale, plus generic `pages get` / `pages get-with-context`.

```bash
pega pages get MyPage
pega pages get MyPage --page-class CW-Work
pega pages get-with-context MyPage --data-context "SomeContextValue"

pega pages portal       MyPortal
pega pages dashboard    MyDashboard
pega pages insight      MyInsight
pega pages channel      MyChannel
pega pages localization en_US
```

`pages get` is a GET (use `--page-class` to disambiguate identical IDs
across classes); `pages get-with-context` is a POST so the page rule
runs against the supplied `dataContext`.

## 9. Static content

Raw resources the Constellation UI normally loads on demand — custom
JS, binary files, profile images.

```bash
pega static-content component     MyComponent
pega static-content component     MyComponent --output ./my-component.js
pega static-content file          MyFile --output ./my-file.bin   # --output required
pega static-content profile-image user123
pega static-content profile-image user123 --output ./profile.jpg
```

When `--output` is optional (`component`, `profile-image`), bytes are
written to disk and stdout emits `{path, bytes, contentType}`. For
`file` it is required — omitting it exits `2` (`INVALID_ARGS`); the
CLI refuses to dump arbitrary binary to the terminal.

## 10. User settings

The operator's per-user preferences (theme, locale overrides, etc.).

```bash
pega user-settings get
pega user-settings patch --data '{"preference":"someValue"}'
pega user-settings patch --data @settings.json
pega user-settings patch --data -
```

The endpoint is profile-scoped: settings written under `--profile
staging` belong to the operator authenticated by that profile's client
credentials, not the local user.
