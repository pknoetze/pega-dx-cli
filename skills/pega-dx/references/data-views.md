# Pega Data Views — When to read this

Read this reference when the user is querying data, working with savable
data records, or invoking data-record actions. For auth, eTag, or
output-format details, read concepts.md.

## Table of contents

1. Catalog: list-objects vs. list-pages
2. Reading: get vs. query vs. count
3. Query body shapes (`--params` vs. `--data`)
4. Query timeout (45s) and paging
5. Record CRUD (with eTag)
6. Record actions (get-action is POST, perform-action is PATCH)

## 1. Catalog: list-objects vs. list-pages

Pega DX V2 splits the "data" world into two catalogs that look similar
but answer different questions. Always start with the catalog the
agent actually needs — querying the wrong endpoint returns an empty
list, not an error.

```bash
# Data objects: savable data records (CRUD-able entities)
# GET /data_objects — use before data create/update/patch/delete.
pega data list-objects

# Data pages: query-able data views (read-only or query-with-POST)
# GET /data_pages — use before data get/query/count.
pega data list-pages
```

The split matters because the same `D_*` identifier can refer to either
a query view or a savable record depending on how it was defined in
Dev Studio. If `data get` or `data query` returns 404, check the other
catalog before assuming the ID is wrong.

> **Gotcha:** `list-objects` only returns data objects exposed by the
> application's API metadata. A `D_*` view used internally by UI logic
> may not appear in either catalog even though it exists in the rule
> base — discoverability here is application-config-dependent.

## 2. Reading: get vs. query vs. count

Three read verbs map to three different endpoints with different
semantics. Pick by what the agent needs to return.

```bash
# Single record (GET /data_views/{id}). Use when one record is expected.
pega data get D_OrderHeader

# List of rows (POST /data_views/{id}). The standard list/filter call.
pega data query D_OrderList --params '{"FromDate":"2026-01-01"}'

# Just the row count (POST /data_views/{id}/count). Cheaper than query
# when only the size of the result set matters.
pega data count D_OrderList --params '{"Status":"Open"}'
```

`get` is a true GET; `query` and `count` are POSTs because data view
parameters and paging options can exceed reasonable URL lengths. The
CLI does not surface this — `--params` is shaped the same way for
both, and the JSON body is composed for you.

Metadata variants exist for callers that need the data view's schema:
`pega data get-metadata <id>` (GET) and `pega data query-metadata <id>`
(POST). These return field definitions, not rows.

> **Gotcha:** `data get` does **not** accept `--params`. If the data
> view requires parameters to return a record, use `data query` and
> pull the single row from the response — `data get` is only useful
> for parameterless single-record views.

## 3. Query body shapes (`--params` vs. `--data`)

The query commands accept two mutually exclusive input forms. Mixing
them returns an `INVALID_ARGS` exit-2 error before any HTTP call is
made.

```bash
# --params: a JSON object that becomes dataViewParameters in the body.
# Use this for the common case of "filter by these keys".
pega data query D_OrderList --params '{"CustomerID":"C-42","Region":"EU"}'

# --data: the full POST body, including query, paging, dataViewParameters,
# extensions, etc. Use this when the call needs a select projection, a
# server-side filter expression, or anything beyond simple parameters.
pega data query D_OrderList --data @complex-query.json

# These two cannot be combined:
pega data query D_OrderList --params '{"x":1}' --data @body.json  # INVALID_ARGS
```

`--max`, `--page`, and `--include-total` are convenience flags that
compose into the `paging` block of the request body. They are also
mutually exclusive with `--data` — when supplying a hand-built body,
include the paging block inside it directly.

> **Gotcha:** `--params` always JSON-stringifies values as-is. Pega
> data views are strongly typed server-side, so `{"id":"101"}` and
> `{"id":101}` can resolve to different records (or none). Match the
> data view's declared parameter type exactly.

## 4. Query timeout (45s) and paging

The four query verbs (`query`, `count`, `query-metadata`, `query-view`)
run against an extended **45-second** server timeout — much longer
than the default per-request timeout for everything else. This exists
because data views often join across class hierarchies; the CLI does
not override it.

```bash
# Default page size (server-defined) — usually 100 rows
pega data query D_OrderList

# Limit and paginate
pega data query D_OrderList --max 50 --page 2

# Include the total count for client-side pagination UIs
pega data query D_OrderList --max 50 --page 1 --include-total

# Combine with parameters
pega data query D_OrderList --params '{"Status":"Open"}' --max 50 --include-total
```

If a query still times out at 45s, the server returns 408/504 and the
CLI normalises that to a non-zero exit. The fix is server-side
(reduce the data view's complexity or add an index) — there is no
client flag to extend the timeout further.

> **Gotcha:** `--include-total` adds a separate count query
> server-side. For very large datasets this can be the slow part of
> the response. Drop it for streaming/listing use cases where total
> count is not needed.

## 5. Record CRUD (with eTag)

Savable data objects (the `list-objects` catalog) support full CRUD via
the `/data/{id}` endpoint family. The data view ID is the positional
argument on every verb — there is no separate `--key` flag because the
data view's own parameter binding identifies the record.

```bash
# Create (POST /data/{id}) — no eTag needed
pega data create D_OrderHeader --data '{"orderId":"O-1","amount":100}'

# Replace (PUT /data/{id}) — eTag auto-fetched from data view GET
pega data update D_OrderHeader --data @full-record.json

# Partial update (PATCH /data/{id}) — eTag auto-fetched
pega data patch D_OrderHeader --data '{"amount":200}'

# Delete (DELETE /data/{id}) — use --params to identify the record
pega data delete D_OrderHeader --params '{"orderId":"O-1"}'
```

`update` and `patch` both round-trip a GET against the data view first
to capture the `ETag` header, then send it as `If-Match` on the
mutation. This means the CLI rejects mutations against records that
have been modified concurrently — the failure mode is a 412 from the
server, surfaced as `ETAG_MISMATCH` (exit 8). See concepts.md section
2 for the full eTag flow.

> **Gotcha:** `data delete` uses `--params` (query-string-style
> identifiers) instead of `--data` (request body). This is asymmetric
> with `create/update/patch`, which all use `--data`. The mismatch
> reflects the underlying API: DELETE takes URL query params, not a
> body.

## 6. Record actions (get-action is POST, perform-action is PATCH)

Data records expose **actions** the same way cases do, but with one
important shape difference: `data get-action` is a **POST**, while
`cases get-action` is a GET. This is because data record actions often
take a partial form payload to render the right action view (Pega
sometimes calls this a "context-sensitive" view).

```bash
# Discover available actions on a data record
pega data list-actions D_OrderHeader

# Get the action view (POST — but --data is optional)
pega data get-action D_OrderHeader --action ApproveOrder
pega data get-action D_OrderHeader --action ApproveOrder --data '{"context":"x"}'

# Perform the action (PATCH /data/{id}/actions/{actionID})
pega data perform-action D_OrderHeader --action ApproveOrder \
  --data '{"approver":"alice"}'
```

`data perform-action` accepts the same `--data`, `--page-instructions`,
and `--attachments` flags as `cases perform-action` and
`assignments perform`. It does **not** auto-fetch an eTag — the data
action endpoint does not require `If-Match` (this is a Pega DX V2
design choice that distinguishes record-action mutation from
record-CRUD mutation).

> **Gotcha:** Because `data get-action` is a POST, an agent that
> caches "GET view, then PATCH submit" patterns from the cases world
> will issue the wrong HTTP verb for data and get a 405. Always use
> the CLI verb (`data get-action`) rather than crafting the URL by
> hand.

## See also

- `concepts.md` section 2 — eTag mechanics used by `data update` and
  `data patch`.
- `concepts.md` section 3 — page-instructions cookbook (relevant to
  `data perform-action` when the action body embeds page lists).
- `concepts.md` section 4 — `--fields` and output formats for trimming
  large query responses.
- `case-lifecycle.md` — for case- and assignment-level actions, which
  share the `--data`/`--page-instructions`/`--attachments` flag shape
  but differ in eTag handling.
