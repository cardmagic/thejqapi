import assert from 'node:assert/strict'

const endpoint = 'https://thejqapi.com/mcp'
const token = process.env.JQ_MONITOR_TOKEN
if (process.env.REQUIRE_MONITOR_AUTH === '1' && !token) {
  throw new Error('The dedicated monitoring credential has not been configured')
}

async function rpc(id, method, params) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-11-25',
      ...(token ? { 'X-JQ-Monitor-Key': token } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    signal: AbortSignal.timeout(20000),
  })
  if (id === undefined) {
    assert([202, 204].includes(response.status), `${method}: HTTP ${response.status}`)
    await response.body?.cancel()
    return
  }
  assert.equal(response.status, 200, `${method}: HTTP ${response.status}`)
  assert.equal(response.headers.get('Mcp-Session-Id'), null, 'Unexpected MCP session')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let bytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      assert(bytes <= 1_000_000, 'Unexpectedly large response')
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
  } finally {
    await reader.cancel()
  }
  const messages = response.headers.get('Content-Type')?.includes('text/event-stream')
    ? text
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => JSON.parse(line.slice(6)))
    : [JSON.parse(text)]
  const message = messages.find((message) => message.id === id)
  assert(message && !message.error, `${method}: invalid JSON-RPC response`)
  return message.result
}

const initialized = await rpc(1, 'initialize', {
  protocolVersion: '2025-11-25',
  capabilities: {},
  clientInfo: { name: 'thejqapi-public-check', version: '1' },
})
assert.equal(initialized.serverInfo.name, 'jq-api')
await rpc(undefined, 'notifications/initialized', {})
const listing = await rpc(2, 'tools/list', {})
// Allow the previous name during a rolling release or rollback of the hosted service.
const processTool =
  listing.tools.find((tool) => tool.name === 'process_json') ??
  listing.tools.find((tool) => tool.name === 'process')
assert(processTool, 'JSON processing tool is missing')
const result = await rpc(3, 'tools/call', {
  name: processTool.name,
  arguments: { input: { name: 'Alice' }, filter: '.name' },
})
assert.equal(result.isError, false)
assert.equal(result.structuredContent.success, true)
assert.equal(result.structuredContent.result, 'Alice')
assert.equal(result.structuredContent.rawResult, '"Alice"')
assert.equal(typeof result.structuredContent.executionTime, 'number')
if (token) assert.equal(result._meta?.monitoring, true, 'Dedicated monitoring was not recognized')
console.log('MCP initialization, discovery, and process_json example passed.')
