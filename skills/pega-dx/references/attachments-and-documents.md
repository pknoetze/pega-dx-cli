# Pega Attachments & Documents — When to read this

Read this reference when the user needs to upload files or URLs to a
case, download attachment content, manage attachment metadata, or access
document records. For auth and output formats, read concepts.md.

## Table of contents

1. Two-phase file upload
2. URL attachments (single-step)
3. Listing and fetching attachments
4. Patching attachment metadata
5. Deleting attachments
6. Documents (read-only metadata + delete)

## 1. Two-phase file upload

Pega's file-upload flow is **two requests**, on purpose:

```bash
# Step 1 — Upload the file bytes; server returns a temporary attachment ID
pega attachments upload --file ./report.pdf
# → {"ID":"<temp-uuid>"}

# Step 2 — Link the temp upload to a case as a permanent attachment.
#          The --attachments flag takes a JSON array of attachment descriptors.
pega attachments add MYAPP-CASE-1 --attachments '[
  {"type":"File","category":"File","name":"Report.pdf","ID":"<temp-uuid>"}
]'
```

Capture the `ID` from step 1 (e.g. `jq -r .ID`) and feed it into the
`ID` property of an element in the `--attachments` array. The `category`
must match a configured attachment category in the case type — fetch
the allowed list with `pega cases list-attachment-categories <caseId>`.

Use `--append-unique-id` on `attachments upload` if you want the server
to suffix the filename so concurrent uploads don't collide:

```bash
pega attachments upload --file ./report.pdf --append-unique-id
```

> **Gotcha:** A temp attachment ID from `attachments upload` is short-lived.
> If you don't link it to a case promptly, the server can garbage-collect
> it and the next `attachments add` call will 404.

## 2. URL attachments (single-step)

A URL attachment links to an external resource — no upload is needed,
so the entire flow is one call:

```bash
pega attachments add MYAPP-CASE-1 --attachments '[
  {"type":"URL","category":"URL","name":"Pega docs","url":"https://docs.pega.com"}
]'
```

`type` must be `"URL"` (case-sensitive). The `url` field is required for
URL attachments and ignored for `File` entries. You can mix `File` and
`URL` entries in a single atomic batch:

```bash
pega attachments add MYAPP-CASE-1 --attachments '[
  {"type":"File","category":"File","name":"Report.pdf","ID":"<temp-uuid>"},
  {"type":"URL","category":"URL","name":"Pega docs","url":"https://docs.pega.com"}
]'
```

The whole batch is atomic — if any entry is rejected, none are linked.

## 3. Listing and fetching attachments

```bash
# List every attachment on a case
pega attachments list MYAPP-CASE-1

# Include thumbnails (base64'd images) in the response
pega attachments list MYAPP-CASE-1 --include-thumbnails

# Fetch attachment metadata + content envelope (JSON to stdout)
pega attachments get ATTACH-1

# Fetch and write the decoded bytes to disk; metadata JSON still emits
# on stdout (the {path, bytes, type} summary)
pega attachments get ATTACH-1 --output /tmp/report.pdf
```

`attachments get` is dual-mode:

- Without `--output`, stdout is the raw JSON the server returned. For
  `type=File` attachments, the content is base64-encoded in the `message`
  field; for `type=URL`, the `url` string holds the link; for
  `type=Correspondence`, the rendered HTML is in `content`.
- With `--output <path>`, the CLI decodes the content automatically
  (base64 for `File`, raw text for `URL`/`Correspondence`) and writes it
  to disk. Stdout emits a small `{path, bytes, type}` summary so you
  can confirm the write in scripts.

## 4. Patching attachment metadata

`attachments patch` updates the human-facing **name** and/or **category**
of an existing attachment. It does not re-upload bytes and does not
require an eTag.

```bash
# Rename
pega attachments patch ATTACH-1 --name "invoice-final.pdf"

# Reclassify
pega attachments patch ATTACH-1 --category Receipts

# Both at once
pega attachments patch ATTACH-1 --name "invoice-final.pdf" --category Receipts
```

At least one of `--name` or `--category` is required. Omitting both
exits `2` with `INVALID_ARGS`.

## 5. Deleting attachments

```bash
pega attachments delete ATTACH-1
```

This removes the attachment record and (for `File` types) the underlying
content. There is no soft-delete — the operation is permanent.

## 6. Documents (read-only metadata + delete)

The `documents` group is intentionally smaller than `attachments`: only
**get** (metadata for a document by ID) and **delete** (remove a
document's link to a case) are exposed.

```bash
# Fetch a document's metadata by document ID
pega documents get DOC-1

# Remove a document link from a case
#  --document is the document ID; case ID is the positional argument
pega documents delete MYAPP-CASE-1 --document DOC-1
```

> **Gotcha:** `pega documents` does **not** include `list`, `create`, or
> `upload` — that surface is handled by the `attachments` group. The
> `documents` endpoints in Pega DX V2 wrap a separate Document rule type
> and are limited to metadata read and link removal. If the user needs
> to upload a new document, use `attachments upload` + `attachments add`
> with a `Document` category, not `documents`.

### Discovering categories before uploading

Most attachment failures come from picking a `category` value the case
type does not accept. Fetch the allow-list first:

```bash
pega cases list-attachment-categories MYAPP-CASE-1
```

Use the `ID` field from the response as the `category` value in the
`attachments add` payload. Common defaults are `File`, `URL`,
`Correspondence`, and `Document`, but applications routinely add their
own (`Receipts`, `Evidence`, `Proposals`, etc.).
