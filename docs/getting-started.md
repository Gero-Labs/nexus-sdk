# Getting started

## Install

```bash
npm install @adlabs/nexus
```

The client has zero runtime dependencies. To use Nexus as a transaction provider in a
lucid-evolution or Mesh app, use the framework's native Nexus provider instead — see the
[migration guide](./migration.md#1-drop-in-provider-swap).

## Construct a client

```ts
import { NexusClient } from "@adlabs/nexus";

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
});
```

### Options

| Option | Default | Notes |
|---|---|---|
| `apiKey` | — | Required. Sent as the `X-Api-Key` header. |
| `network` | the key's scoped network | `CARDANO_MAINNET` / `CARDANO_PREPROD` / `CARDANO_PREVIEW`. When set, it is sent as `?network=` on every Cardano request. Omit to let the key decide. |
| `baseUrl` | `https://nexus.gerowallet.io` | For self-hosted Nexus deployments. |
| `timeoutMs` | `30000` | Per-attempt timeout. |
| `retryDelaysMs` | `[250, 1000]` | GET retry backoff on 5xx / network errors. POSTs are not retried. |

Get an API key and manage your subscription at
[nexus.gerowallet.io](https://nexus.gerowallet.io).

## Make calls

Everything is reached through three namespaces on the client:

```ts
// Cardano chain data
const summary = await nexus.cardano.addresses.get("addr1...");
const utxos = await nexus.cardano.addresses.utxos("addr1...", { page: 1, pageSize: 100 });
const pool = await nexus.cardano.pools.byId("pool1...");

// Cardano market data (mainnet only — see the market reference)
const prices = await nexus.cardano.market.prices();

// Bitcoin
const tip = await nexus.bitcoin.chain.tip();

// Midnight (network is the first argument, a path segment)
const info = await nexus.midnight.info.get("undeployed");
```

See the [API reference](./README.md#api-reference) for every resource and method.

## Types

Response and request types are generated from the live Nexus OpenAPI document. The raw DTOs
are exported as `components`:

```ts
import type { components } from "@adlabs/nexus";

type Pool = components["schemas"]["PoolDto"];
```

## Next steps

- [Errors](./errors.md)
- [Pagination](./pagination.md)
