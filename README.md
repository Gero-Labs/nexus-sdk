# @adlabs/nexus

TypeScript SDK for the [Nexus](https://nexus.gerowallet.io) API — a typed, namespaced client
covering Cardano (chain + market data), Bitcoin, and Midnight, plus an optional
[lucid-evolution](https://github.com/Anastasia-Labs/lucid-evolution) provider.

- Zero runtime dependencies in the core client.
- Response and request types generated from the live Nexus OpenAPI spec.
- `X-Api-Key` auth, automatic GET retries, per-request timeout.

📚 **Full documentation:** [`docs/`](./docs/) — [getting started](./docs/getting-started.md),
[migration](./docs/migration.md), [errors](./docs/errors.md),
[pagination](./docs/pagination.md), and the per-namespace API
reference ([Cardano](./docs/reference/cardano.md) ·
[market data](./docs/reference/market.md) · [Bitcoin](./docs/reference/bitcoin.md) ·
[Midnight](./docs/reference/midnight.md)).

## Install

```bash
npm install @adlabs/nexus
```

## Quick start

```typescript
import { NexusClient } from "@adlabs/nexus";

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
  network: "CARDANO_MAINNET", // optional; omit to use the API key's scoped network
});

// Cardano chain data
const utxos = await nexus.cardano.addresses.utxos("addr1...");
const pool = await nexus.cardano.pools.byId("pool1...");
const proposals = await nexus.cardano.governance.proposals();
const params = await nexus.cardano.epochs.latestParameters();

// Bitcoin
const btcUtxos = await nexus.bitcoin.addresses.utxos("bc1q...");
const tip = await nexus.bitcoin.chain.tip();

// Midnight (network is a path segment)
const info = await nexus.midnight.info.get("undeployed");
const dust = await nexus.midnight.dust.status("undeployed", "stake1...");
```

## Namespaces

| Namespace | Resources |
|---|---|
| `nexus.cardano` | `addresses`, `accounts`, `assets`, `blocks`, `epochs`, `network`, `pools`, `dreps`, `governance`, `scripts`, `policy`, `transactions`, `txBuilder`, `market` |
| `nexus.bitcoin` | `addresses`, `txs`, `blocks`, `fees`, `mempool`, `chain`, `ordinals` |
| `nexus.midnight` | `info`, `tx`, `dust`, `indexer` |

### Cardano market data (`nexus.cardano.market`)

Token prices, DEX pools/orders/swaps, NFT collections, wallet PnL, the swap aggregator,
leaderboard, sync status, and blueprints:

```typescript
const prices = await nexus.cardano.market.prices();
const pools = await nexus.cardano.market.dex.pools();
const floor = await nexus.cardano.market.nft.floor("policy...");
const pnl = await nexus.cardano.market.wallet.pnl("stake1...");
const quote = await nexus.cardano.market.aggregator.quote({ /* ... */ });
const candles = await nexus.cardano.market.candles.latest();
```

> **Mainnet only.** Market data is served from Cardano mainnet. If the client was
> constructed with an explicit non-mainnet `network`, every `market` call throws
> `NexusUsageError` before making a request. With no `network` set, the call proceeds and a
> wrong-network or wrong-tier API key is rejected server-side as a `NexusApiError`.

## Errors

- `NexusApiError` — any non-2xx API response (`.status`, `.message`, `.code?`).
- `NexusUsageError` — client-side misuse caught before a request (e.g. the market guard).

Single-item lookups (`.byId`, `.byHash`) resolve to `null` on 404; collections resolve to
an array.

## Types

Types are generated from the live OpenAPI document and shipped with the package. DTO shapes
are available via the generated `components`:

```typescript
import type { components } from "@adlabs/nexus";
type Pool = components["schemas"]["PoolDto"];
```

Regenerate after an API change:

```bash
npm run gen:types   # NEXUS_OPENAPI_URL overrides the source spec
```

## Use with lucid-evolution

```bash
npm install @adlabs/nexus @lucid-evolution/lucid
```

```typescript
import { Lucid } from "@lucid-evolution/lucid";
import { NexusProvider } from "@adlabs/nexus/lucid";

const lucid = await Lucid(
  new NexusProvider({ apiKey: process.env.NEXUS_API_KEY!, network: "Preprod" }),
  "Preprod",
);
```

> The `/lucid` adapter's type dependency (`@lucid-evolution/core-types`) transitively
> installs the Cardano multiplatform WASM libraries (~9MB). The core client has zero
> runtime dependencies.

## Client options

| Option | Default | Notes |
|---|---|---|
| `apiKey` | — | Nexus API key (`X-Api-Key`) |
| `network` | key's scoped network | `CARDANO_MAINNET` / `CARDANO_PREPROD` / `CARDANO_PREVIEW` (the `/lucid` provider takes `Mainnet` / `Preprod` / `Preview`) |
| `baseUrl` | `https://nexus.gerowallet.io` | self-hosted Nexus deployments |
| `timeoutMs` | `30000` | per-attempt timeout |
| `retryDelaysMs` | `[250, 1000]` | GET retry backoff on 5xx / network errors |

## Development

```bash
npm install
npm run gen:types   # regenerate src/generated/schema.d.ts from the live spec
npm run typecheck
npm run lint
npm test            # unit tests
npm run build       # ESM + CJS + d.ts
NEXUS_API_KEY=... npm test   # + live integration tests
```
