# The JQ API — free hosted jq MCP server and REST API

[Website](https://thejqapi.com/) · [API reference](https://thejqapi.com/api) · [Status](https://thejqapi.com/status) · [Privacy](https://thejqapi.com/privacy)

[Official MCP Registry record](https://registry.modelcontextprotocol.io/v0.1/servers/com.thejqapi%2Fjq-api/versions/latest)
— published as `com.thejqapi/jq-api` using domain ownership verification.

Run jq filters directly on JSON from AI conversations, API responses, and webhooks.
Connect to **https://thejqapi.com/mcp** using stateless Streamable HTTP. No local jq
installation, server package, or Docker container is required for the hosted service.

**Operated by Craftsman Founder LLC, maintained by Lucas Carlson.**
Contact: [contact@thejqapi.com](mailto:contact@thejqapi.com).

This is the public documentation, examples, monitoring, and issue-reporting repository.
The hosted server implementation is private. This repository is not a self-hostable server.

## When to choose this service

- Your assistant supports remote MCP but cannot run local shell commands.
- JSON is already available in a conversation or HTTP workflow.
- You want field extraction, array filtering, or JSON transformations without installing jq.
- The data is suitable for processing by a hosted service.

REST and MCP run jq compiled to WebAssembly on Cloudflare Workers, including built-in
filters, regex, formatters, user-defined functions, and request-supplied modules.
See the [current engine version](https://thejqapi.com/engine.json) and
[compatibility and options reference](https://thejqapi.com/api#jq-compatibility).
For large private files that must stay on your device, use a local tool.

## Add the MCP server

**Claude Code**

```sh
claude mcp add --transport http jq-api https://thejqapi.com/mcp
```

**Codex**

```sh
codex mcp add jq-api --url https://thejqapi.com/mcp
```

**Other clients**

Use the remote server URL `https://thejqapi.com/mcp`, or open the
[MCP installation chooser](https://install.apicommons.org/?server=https%3A%2F%2Fthejqapi.com%2Fserver.json).
Native Cursor and VS Code install buttons are on the website.

The public [server manifest](https://thejqapi.com/server.json) contains the current
version and endpoint. No personal UUID or credential is included in installation links.
PNG and SVG icons are included for MCP clients and directories.

## Tool contract

| Tool            | Use it for                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| `process_json`  | Query inline JSON, a URL, or an upload; `filter: "."` reads the whole document.     |
| `upload_json`   | Store immutable JSON once for repeated queries over the next 15 minutes.            |
| `delete_upload` | Remove one upload early, without consuming processing quota.                        |
| `get_upload`    | Inspect availability, expiration, and size without reading JSON or consuming quota. |
| `get_quota`     | Read the caller's remaining daily allowance and UTC reset, without consuming quota. |

**`process_json`** accepts inline JSON, a public HTTPS URL, or a reusable upload ID:

```json
{ "input": { "name": "Alice" }, "filter": ".name" }
```

The successful structured result includes:

```json
{ "success": true, "result": "Alice", "rawResult": "\"Alice\"", "executionTime": 0 }
```

`executionTime` varies and is reported in milliseconds. MCP also provides the result
as text for client compatibility. Processing errors have `isError: true` and an error
message. Inspect the current argument schema with `tools/list`.

The tool has no local filesystem access, shell execution, or
connected-account permissions. JSON is transmitted over HTTPS and processed on
Cloudflare Workers.

## jq options and modules

The `process_json` tool and REST endpoint accept the same optional `options` object:

- `args`: named string variables (`--arg`); `argjson`: named JSON variables (`--argjson`).
- `null_input` (`-n`), `slurp` (`-s`), and `raw_input` (`-R`).
- `input_stream`: treat a string input as multiple JSON texts; combine with `slurp` to collect them.
- `raw_output` (`-r`), `join_output` (`-j`), `compact_output` (`-c`), `sort_keys` (`-S`), and `ascii_output` (`-a`).
- `modules`: relative `.jq` or `.json` filenames mapped to their text contents.

```json
{
  "input": [1, 2, 3],
  "filter": "include \"math\"; map(scale($factor))",
  "options": {
    "argjson": { "factor": 4 },
    "modules": { "math.jq": "def scale($n): . * $n;" }
  }
}
```

Each call has its own in-memory module files and environment. Module files are never
written to persistent storage, and they cannot read the host filesystem or Worker secrets.
Exactly one of `input`, `url`, or `upload_id` is required; use `input: null` with `null_input`. A normal JSON array is one
input value, so `slurp: true` wraps it in another array, following jq's `-s` semantics.

Responses retain `result` and `rawResult` for existing clients and add `results` (an
array containing every emitted jq value), `stdout` (jq output honoring formatting
options, including whitespace and newlines), and `jqVersion`. `debug` output is
returned as `stderr` to the caller, without being logged by the application.

JSON value inputs and structured results use JavaScript number precision. For exact
JSON numeric text, use `input_stream` and read `stdout`.

The engine is tested against 62 native jq reference examples covering the filter
language, built-ins, formats, regex, variables, modules, and supported options.
This is a hosted JSON interface: native CLI filesystem, shell, process environment,
and arbitrary command-line flags are not exposed. Cloudflare resource limits apply.

## URL and upload inputs

`process_json` / `POST /process` accepts exactly one of `input`, `url`, or `upload_id`,
alongside `filter` and the existing jq `options`. Documents are limited to **5 MiB**;
JSON request envelopes are limited to 8 MiB.

```json
{ "url": "https://registry.npmjs.org/jq-wasm/latest", "filter": ".name" }
```

Use any public HTTPS JSON URL you control. URL fetching accepts port 443 only, with
no credentials, private addresses, custom headers, or connected-account access.
Every redirect is validated; downloads have a 10-second deadline and at most three
redirects. JSON is expected by default; use `raw_input` for text or `input_stream`
for a sequence of JSON values. A direct URL query does not persist its document.

Upload a local JSON document over REST without pasting it into an AI conversation:

```sh
curl https://thejqapi.com/uploads \
  -H 'Content-Type: application/json' --data-binary @data.json
# Alternatively: curl https://thejqapi.com/uploads -F file=@data.json
```

The response contains `upload_id`, `expires_at`, and `size_bytes`. The body above is
raw JSON, not an `input` wrapper. Reuse the ID with different filters:

```sh
curl https://thejqapi.com/process \
  -H 'Content-Type: application/json' \
  -d '{"upload_id":"YOUR_UPLOAD_ID","filter":".name"}'
curl -X DELETE https://thejqapi.com/uploads/YOUR_UPLOAD_ID
```

To fetch once and reuse a URL, `POST /uploads/from-url` with `{"url":"https://..."}`.
MCP exposes **`upload_json`** with exactly one of `input` or `url`, **`process_json`** with
`upload_id`, and **`delete_upload`** with `upload_id`. A local file must first be
uploaded over HTTP by the client; the MCP server cannot read a local path.
Only filter results need to enter the model context when using URL/upload references.

Uploads are private, reusable for **15 minutes**, and can be deleted early. Anyone
holding the secret ID can query or delete its data: treat it as a credential. There
is no public listing or raw-download endpoint. Expiration returns HTTP 410, a missing
or deleted document returns 404, oversize input returns 413, and unavailable storage
returns 503. MCP returns corresponding structured tool errors.

Upload and processing attempts each consume one call from the existing shared quota.
Deletion, MCP initialization, and discovery do not consume processing quota.

### Inspect uploads and quota without consuming calls

MCP `get_upload` takes the secret `upload_id` and returns `available`, `status`
(`available`, `missing`, or `expired`), `expires_at`, `expires_in_seconds`, and
`size_bytes`. The REST equivalent is `GET /uploads/{upload_id}`. It reads metadata
only and does not refresh expiration. A missing/deleted or expired reference returns
HTTP 200 with `available: false` and `size_bytes: null`; processing that reference
still returns 404 or 410. To read an upload's contents, use `process_json` with
`{"upload_id":"YOUR_UPLOAD_ID","filter":"."}`. Uploads are immutable: upload a new
document to change the JSON, and delete the old reference when finished.

MCP `get_quota` takes no arguments. `GET /quota` is its REST equivalent. Both return
`success`, `tier` (`anonymous` or `uuid`), `limit`, `used`, `remaining`, and `reset_at`
(next midnight UTC). They use the same request IP or client-configured UUID bearer
header as processing; do not put credentials in tool arguments. A quota snapshot
does not reserve calls, and concurrent calls can change the remaining allowance.

```sh
curl https://thejqapi.com/quota -H 'Authorization: Bearer YOUR_UUID'
curl https://thejqapi.com/uploads/YOUR_UPLOAD_ID
```

These checks do not consume processing quota, create quota records, or count as
processing analytics. They remain available when the daily processing quota is
exhausted. Invalid IDs are rejected; unavailable storage returns a structured 503
error. Neither check returns a document's JSON or the caller's IP/UUID.

## Free limits

- **100 requests/day per IP** without a token.
- **1,000 requests/day per UUID** with `Authorization: Bearer YOUR_UUID`.
- Any valid UUID can be used; no signup, credit card, or OAuth is required.
- UUIDs identify quota counters, not authenticated accounts.
- REST and MCP share the daily quota, which resets at midnight UTC.
- MCP initialization and discovery do not consume processing quota.

See the [API reference](https://thejqapi.com/api) for headers and errors. For unlimited
queries with zero application query logs, buy the optional
[2 USDC, 30-day prepaid pass](#prepaid-private-access-x402) on Base mainnet.

## Try REST

```sh
curl https://thejqapi.com/process \
  -H 'Content-Type: application/json' \
  -d '{"input":{"name":"Alice"},"filter":".name"}'
```

## Verify MCP independently

With Node.js 22 or later:

```sh
node checks/mcp.mjs
```

This dependency-free client checks initialization, absence of sessions, `tools/list`,
and a real `process_json` call returning `"Alice"`. It sends only the fixed public example.
A manual invocation uses ordinary anonymous quota. You can also copy the raw request
from the [website verification example](https://thejqapi.com/#service-facts).

[![MCP check](https://github.com/cardmagic/thejqapi/actions/workflows/mcp-status.yml/badge.svg)](https://github.com/cardmagic/thejqapi/actions/workflows/mcp-status.yml)

The scheduled GitHub workflow runs approximately every five minutes, using a dedicated
credential that exempts only this fixed example from customer quotas and analytics.
It never receives customer payloads. GitHub can delay, skip, or disable scheduled runs;
the status page marks stale observations as unknown. Public workflow logs provide the
original evidence. Failed runs can also reflect network or runner problems. Availability
history consists of recorded checks, not a contractual uptime guarantee.

## Data handling

Inline and direct URL processing data is not persisted. Explicit uploads are stored privately
for 15 minutes, with early deletion available. Upload IDs are secrets. Submitted JSON,
source URLs, filters, and results are kept out of application logs.
The active quota database retains identifying usage records for the current UTC day,
then aggregates expired records and removes the identifiers during cleanup. Historical
totals contain no IP addresses or UUIDs. Hosting-provider logs and backups have separate
retention. The [privacy notice](https://thejqapi.com/privacy) explains these boundaries
and website analytics.

## Support and issue reports

Use [Issues](https://github.com/cardmagic/thejqapi/issues) for reproducible problems and
feature requests. Include a minimal public JSON example, jq filter, expected output,
actual response, and client name. Avoid secrets and customer data.

For private reports, email [contact@thejqapi.com](mailto:contact@thejqapi.com).
See [SECURITY.md](SECURITY.md) and [CHANGELOG.md](CHANGELOG.md).

## Agent discovery and quota recovery

- [OpenAPI 3.1](https://thejqapi.com/openapi.json): REST request/response schemas, UUID authentication, input options, errors, limits, and the x402 purchase flow.
- [Agent quickstart](https://thejqapi.com/llms.txt) and [full text](https://thejqapi.com/llms-full.txt): concise operating instructions, privacy boundaries, and payment recovery.
- [AI catalog](https://thejqapi.com/.well-known/ai-catalog.json) and [MCP Server Card](https://thejqapi.com/mcp/server-card): current draft discovery formats; the card advertises the real Streamable HTTP MCP endpoint. Legacy `/.well-known/mcp.json`, `/.well-known/agent-card.json`, and `/.well-known/agent.json` redirect to that MCP card. This service does not implement the A2A protocol.

These public metadata endpoints support CORS, HEAD, caching, and ETag revalidation without using query quota or storing usage records. Live MCP `tools/list` is authoritative for tool schemas.

An exhausted REST quota returns HTTP **429**, `reset_at`, `Retry-After`, and `Link` headers for pricing/checkout. Its JSON `upgrade` object contains the 2-USDC / 30-day plan, `/pricing`, `/access`, `/access/purchases`, and the MCP `purchase_access` tool. MCP quota errors carry the same structured offer. `get_quota` / `GET /quota` also return the offer when remaining allowance is zero. Do not repeatedly retry an exhausted quota: wait until the UTC reset or purchase access under an explicit spending policy. A 429 never charges a wallet. The actual purchase endpoint returns the standard x402 **402** challenge.

REST clients can upgrade on the **original processing request**: add `X-JQ-Payment: pass` and a saved UUID bearer token to `POST /process`, `POST /uploads`, or `POST /uploads/from-url`. An inactive UUID receives a standard x402 HTTP **402** challenge. Keep the header on the signed retry; the confirmed pass activates before the query or upload runs, with no free-tier quota/source writes. This explicitly purchases **30 days for 2 USDC**, not one query. Active passes are not charged again. HTTP **202** means settlement is pending and processing has not run; inspect the returned purchase ID instead of paying again. The separate purchase endpoints and MCP `purchase_access` remain available.

## Pay per query (x402)

For occasional queries, pay **0.005 native USDC on Base per execution attempt** instead of buying a pass. An active 30-day pass is never charged again. Check [live pricing](https://thejqapi.com/pricing). Use an x402-capable client with an explicit **$0.005 maximum payment** policy and a saved secret UUID bearer token.

```http
POST /process
Authorization: Bearer YOUR_SECRET_UUID
Content-Type: application/json
X-JQ-Payment: query
Idempotency-Key: A_NEW_UUID_FOR_THIS_LOGICAL_QUERY
X-JQ-Privacy: required

{"input":{"name":"Alice"},"filter":".name"}
```

The unsigned request returns HTTP **402** with `PAYMENT-REQUIRED` for **5000 atomic USDC**. The wallet client signs and retries with `PAYMENT-SIGNATURE`, preserving the body, payment mode and idempotency key. Create the key **once per logical query**, not per HTTP retry, and never keep one fixed key in persistent client settings. The response includes `X-JQ-Purchase-Id`; settlement returns `PAYMENT-RESPONSE`.

For MCP, call `process_json` with normal arguments and this request metadata; add `"x402/payment": SIGNED_PAYMENT_PAYLOAD` to `_meta` on the signed retry:

```json
{
  "com.thejqapi/payment": {
    "mode": "query",
    "idempotency_key": "A_NEW_UUID_FOR_THIS_LOGICAL_QUERY"
  }
}
```

The challenge is in the tool error’s `structuredContent`; the receipt is in `_meta.query_payment` and `_meta["x402/payment-response"]`. Tool arguments never contain wallet keys, UUID credentials or payment data. MCP clients without x402 support can use free access or an already-paid pass.

**Errors and recovery:** structural request validation happens before payment. Payment is settled **before jq execution**, so jq/runtime and remote-input failures after settlement are chargeable. HTTP **202** or MCP `payment_status:202` means pending settlement and no execution. Read `GET /access/purchases/{idempotency_key}` using the same bearer; never submit another payment to recover an uncertain order. Resume the original request/key after settlement. Each payment permits at most **three identical delivery attempts within 15 minutes**, including the first. Retries re-execute the query, not a cached result, so URL content can change. Changed requests or exhausted attempts return **409**; expired delivery returns **410** without another charge.

**Privacy:** per-query processing bypasses free IP/UUID counters and source analytics, and stores no JSON, filter, URL or result. It retains **one billing receipt per logical query**, a payment timestamp, and a keyed request fingerprint plus retry counter until the delivery window expires (cleanup runs every five minutes). Pending orders keep recovery data; resolved receipts are retained for up to 365 days. Public payments reveal timing and count. The $2 pass offers the stronger absence of per-query records. Both options retain Cloudflare, public-payment and explicit temporary-upload boundaries described in [privacy](https://thejqapi.com/privacy).

Once paid, a UUID stays protected from tracked free fallback: use an active pass or explicit query payments. `GET /access/status` checks this privacy preference without consuming a call. Upload creation uses free access or a pass; per-query billing applies only to `POST /process` / `process_json`, whose inputs can be inline JSON, public URLs or existing upload IDs.

## Prepaid private access (x402)

An optional pass costs **2 USDC for 30 days of unlimited jq queries with zero application query logs**. Purchases are live with native USDC on Base mainnet through x402. Each renewal is a separate purchase after expiration. Check `GET /pricing` for current availability. Free access remains available.

**Easiest setup:** open [private checkout and MCP setup](https://thejqapi.com/access), generate or reuse a secret UUID, save it in a password manager, connect a Base browser wallet, and pay once. The page validates a single-use authorization for exactly 2 native USDC, with no token allowance or automatic renewal. It never asks for a wallet private key or recovery phrase. Copy settings for Codex, Claude Code, Cursor, or VS Code; an ordinary MCP client can use the paid UUID without wallet support. Checkout has no analytics or third-party scripts, and does not store the UUID in browser storage or URLs.

**What the 30-day pass adds:** free queries already keep JSON, filters, results, and source URLs out of application logs. Pass queries additionally skip IP/UUID quota records, query counts, last-used history, and REST/MCP/Zapier usage analytics. The daily query cap is removed; document, execution, and upload-lifetime limits remain.

**Privacy-safe expiry:** a UUID that has received paid access rejects queries after expiry until renewed, even without a privacy header. It never silently falls back to tracked free access. One keyed hash is retained as a privacy preference after expiry and receipt cleanup, without timestamps or activity. UUID queries fail closed when access cannot be verified. Keep `X-JQ-Privacy: required` in client settings too, to protect new or mistyped unpaid UUIDs. `GET /access/status` reads the bearer UUID’s access/expiry/privacy status without consuming a call, including after expiry. Choose a new unpaid UUID or omit authentication and the privacy header only if you explicitly want free access.

1. Send `POST /access/purchases` with `{}` and your secret UUID bearer header. Save the returned `purchase_id` and `checkout_url`. An active pass returns status without a new charge.
2. POST to the checkout URL. An x402-capable wallet client handles the HTTP 402 `PAYMENT-REQUIRED` challenge and retries with `PAYMENT-SIGNATURE` for exactly 2 USDC. Successful settlement returns `PAYMENT-RESPONSE`, `active:true`, and `expires_at`.
3. Check `GET /access/purchases/{purchase_id}` to recover the receipt or pending status. Retry the same purchase; do not pay again while settlement is pending.
4. Keep using the UUID for REST and MCP. Persist **`X-JQ-Privacy: required`** in the client configuration: new/unpaid and expired access then fails before free-tier tracking.

MCP `purchase_access({})` exposes the same flow. Its optional `purchase_id` resumes a known order. Payment requirements appear in `structuredContent` and text with `isError:true`; the client supplies payment in request `_meta["x402/payment"]`, and receives a receipt in response `_meta["x402/payment-response"]`. Never put wallet keys, UUID credentials, or signatures in tool arguments. A normal MCP client can use an already-paid UUID without wallet support. Purchasing requires an x402-capable wallet/client and an explicit 2 USDC spending policy; some clients default to a $1 ceiling.

`get_quota` / `GET /quota` return `tier:"paid"`, `unlimited:true`, `expires_at`, `privacy:"zero_application_query_logs"`, `auto_renew:false`, and null allowance/count fields. Paid processing and upload creation bypass the shared daily counter. No pass query counts, last-used records, or source analytics are maintained. The 5 MiB document limit, 15-minute upload lifetime, and execution limits still apply.

The application does not retain pass-query inputs, filters, results, URLs, IPs, user agents, timestamps, or query history. Minimal payment/access records and explicitly requested uploads are retained separately. USDC transfers are public on Base and the facilitator processes payment details. Cloudflare handles network/security metadata under its own policies. Explicit uploads use private temporary storage with 15-minute access; cleanup can delay physical deletion. A minimal keyed-hash privacy preference is retained indefinitely to protect expired keys. See [privacy and retention](https://thejqapi.com/privacy) for the precise commitment. This is not a claim of anonymity or zero retention by every provider.

Billing/access records use a keyed hash of the UUID. Orders and EIP-3009 authorizations are deduplicated; pending settlement is reconciled before another payment is permitted. An agent can choose to purchase again under its wallet policy, but the service never initiates renewal.
