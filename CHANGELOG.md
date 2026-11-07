# Changelog

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
