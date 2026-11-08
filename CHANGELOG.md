# Changelog

## 2.5.0 — 2026-11-08

- Add opt-in 0.005-USDC per-query x402 payments on REST process and MCP process_json, with exact amount verification and receipt recovery.
- Bind each payment to one idempotency UUID and a keyed request fingerprint; limit identical delivery retries to three attempts within 15 minutes, without caching payloads or charging twice.
- Preserve active pass bypass and zero pass-query records; disclose per-query billing receipts and temporary retry data separately.
- Show pass/query payment counts and precise fractional USDC in admin; update OpenAPI, agent discovery, quota offers, and documentation.

## 2.4.0 — 2026-11-08

- Add machine-readable OpenAPI 3.1 and llms.txt / llms-full.txt with actual inputs, quotas, errors, x402 purchase instructions, and privacy boundaries.
- Add the draft MCP Server Card and AI Catalog discovery formats, with explicit MCP/REST identity and no claim of A2A support.
- Include structured paid upgrade offers and reset instructions in exhausted REST/MCP quota responses; expose pricing and checkout through Link headers.
- Support opt-in same-request x402 pass upgrades with X-JQ-Payment: pass, without free-tier tracking or duplicate settlement.
- Serve discovery without query quota or usage writes, with CORS, HEAD, and ETag support.

## 2.3.0 — 2026-11-08

- Keep expired paid UUIDs private by default, even after old billing records are deleted; renewal is required before querying again.
- Add browser-wallet checkout and ready-to-copy private MCP configuration for Codex, Claude Code, Cursor, and VS Code.
- Explain the incremental paid privacy benefit and Cloudflare, public-payment, billing, and temporary-upload boundaries.
- Add authenticated admin billing summaries, hashed account labels, expiry, retained revenue, and receipt status without collecting paid query activity.
- Replace the admin page’s embedded credential with a server secret and signed secure sessions; remove third-party admin scripts.

## 2.2.0 — 2026-11-08

- Add x402 v2 purchase endpoints and MCP `purchase_access` for a one-time 2 USDC, 30-day UUID access pass. Renewals require a separate purchase after expiration.
- Enable public purchases with native USDC on Base mainnet after successful testnet and mainnet acceptance checks.
- Recover interrupted settlements using RPC log scans paginated within the public Base RPC block-range limit.
- Isolate billing records from query usage, with duplicate-payment protection and settlement reconciliation.
- Paid processing bypasses quota/source analytics; invocation logging and tracing are disabled. `X-JQ-Privacy: required` rejects expired or unverifiable access before free-tier tracking.
- Extend `get_quota` with paid access status, expiration, and explicit privacy information. Paid query counts are not retained.
- Retain explicit temporary-upload behavior and disclose minimal billing records, public onchain payments, and infrastructure privacy boundaries.
- Payment availability is reported by `/pricing`; receiving wallet and facilitator setup are required before activation.

## 2.1.0 — 2026-11-07

- Add `get_upload` and `GET /uploads/{upload_id}` for upload availability, expiration, and size without reading document contents.
- Add `get_quota` and `GET /quota` for remaining daily allowance without consuming calls or creating usage records.
- Clarify all MCP parameters, tool selection, results, failures, capability IDs, and per-request modules.

## 2.0.0 — 2026-11-07

- Rename MCP tools `process` to `process_json` and `upload` to `upload_json` for consistent verb/object names. `delete_upload` is unchanged.
- Refresh MCP tool discovery in existing clients; REST endpoints and request formats are unchanged.
- Publish the public Glama connector ownership proof.

## 1.2.0 — 2026-11-07

- Add public HTTPS URL input to REST and MCP processing, with size, redirect, network, and timeout protections.
- Add JSON file uploads and reusable secret IDs, expiring after 15 minutes, with early deletion.
- Add MCP `upload` and `delete_upload` tools; uploads and queries share existing daily quotas.
- Add URL/file input controls to the playground and document storage and privacy boundaries.

## Server icon

- Added PNG and SVG icons to the public server manifest and MCP server information.
- Added matching browser favicons across the website.

## jq compatibility upgrade

- Replaced the partial interpreter with jq compiled to WebAssembly on Cloudflare Workers.
- Added jq built-ins, regex, formats, user functions, and request-supplied memory-only modules.
- Added named variables, null/text/stream input modes, and jq output formatting options.
- Fixed slurp semantics and preserved exact stdout whitespace and newlines.
- Added results, stdout, and jqVersion while preserving the existing result envelope.
- Verified 62 native jq reference examples and added cross-request isolation tests.
- Published the live engine version and option list at `/engine.json`.

## November 7, 2026 — trust and discovery

- Published operator information: Craftsman Founder LLC, maintained by Lucas Carlson.
- Added a privacy notice describing processing, quota identifiers, aggregate usage,
  provider-managed logs and backups, and website analytics.
- Replaced year-long identifying quota history with current-day identifiers and
  historical aggregate daily totals.
- Published this documentation and examples repository while keeping the hosted
  implementation private.
- Added external MCP checks and a status page based on actual recorded observations.
- Published `com.thejqapi/jq-api` in the official MCP Registry with domain ownership verification.

The current server version is published in the live
[server manifest](https://thejqapi.com/server.json). This changelog starts with this
public documentation release; it does not imply an earlier public release history.
