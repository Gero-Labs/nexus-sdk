# Errors

The SDK throws two error types.

## `NexusApiError`

Thrown for any non-2xx API response.

```ts
import { NexusApiError } from "@adlabs/nexus";

try {
  await nexus.cardano.pools.list();
} catch (err) {
  if (err instanceof NexusApiError) {
    console.error(err.status, err.message, err.code);
  }
}
```

| Property | Type | Notes |
|---|---|---|
| `status` | `number` | HTTP status (e.g. `402`, `403`, `429`, `500`). `0` for a network/timeout failure after retries. |
| `message` | `string` | The API's `error` field when present, otherwise a generic message. Raw response bodies are never surfaced. |
| `code` | `string \| undefined` | Machine-readable error code when the API supplies one. |

Common statuses:

- **401 / 403** — missing, invalid, or wrong-scope API key.
- **402** — the endpoint requires a subscription tier or addon your key lacks.
- **429** — rate or concurrency limit exceeded.

GET requests retry automatically on 5xx and network errors (`retryDelaysMs`); POSTs do not.

## `NexusUsageError`

Thrown for client-side misuse, **before any request is made**. Today this is the market-data
mainnet guard:

```ts
import { NexusClient, NexusUsageError } from "@adlabs/nexus";

const preprod = new NexusClient({ apiKey, network: "CARDANO_PREPROD" });

try {
  await preprod.cardano.market.prices(); // throws synchronously
} catch (err) {
  if (err instanceof NexusUsageError) {
    // "Market data is Cardano mainnet only; client network is CARDANO_PREPROD"
  }
}
```

Because it is a precondition check (like the constructor's missing-`apiKey` error), it throws
synchronously — catch it with `try/catch`, not only `.catch()`. See the
[market reference](./reference/market.md) for the full guard behavior.

## Not-found handling

Single-item lookups resolve to `null` on a 404 rather than throwing, so you can branch on the
result:

```ts
const tx = await nexus.cardano.transactions.byHash(hash);
if (tx === null) {
  // not found
}
```

Collection endpoints return an array (empty, never `null`).
