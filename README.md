# The JQ API — free hosted jq MCP server and REST API

[Website](https://thejqapi.com/) · [API reference](https://thejqapi.com/api) · [Status](https://thejqapi.com/status) · [Privacy](https://thejqapi.com/privacy)

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

For large private files that must stay on your device, use a local tool. The hosted
interpreter supports a subset of jq; modules, some built-in filters, and some output
formats are unsupported. Try your expression in the [playground](https://thejqapi.com/#api-tester).
Both REST and MCP use the same `@jq-tools/jq` interpreter. See its
[compatibility notes](https://github.com/alexxander/jq-tools/tree/main/packages/jq#supported-features).

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

## Tool contract

One tool, **`process`**, accepts JSON values directly:

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

The tool has no local filesystem access, URL fetching, shell execution, or
connected-account permissions. JSON is transmitted over HTTPS and processed on
Cloudflare Workers.

## Free limits

- **100 requests/day per IP** without a token.
- **1,000 requests/day per UUID** with `Authorization: Bearer YOUR_UUID`.
- Any valid UUID can be used; no signup, credit card, or OAuth is required.
- UUIDs identify quota counters, not authenticated accounts.
- REST and MCP share the daily quota, which resets at midnight UTC.
- MCP initialization and discovery do not consume processing quota.

See the [API reference](https://thejqapi.com/api) for headers and errors. Paid plans
are not currently offered. Contact the operator about higher usage needs.

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
and a real `process` call returning `"Alice"`. It sends only the fixed public example.
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

Submitted JSON, filters, and results are not written to application logs or databases.
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
