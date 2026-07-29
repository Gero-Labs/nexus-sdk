# @adlabs/nexus documentation

TypeScript client for the [Nexus](https://nexus.gerowallet.io) API — Cardano (chain +
market data), Bitcoin, and Midnight — plus an optional lucid-evolution provider.

## Guides

- [Getting started](./getting-started.md) — install, construct a client, first calls.
- [Errors](./errors.md) — `NexusApiError`, `NexusUsageError`, and 404 handling.
- [Pagination](./pagination.md) — the `{ page, pageSize }` convention and per-endpoint params.

## API reference

- [Cardano](./reference/cardano.md) — addresses, accounts, assets, blocks, epochs, network,
  pools, dreps, governance, scripts, policy, transactions, txBuilder.
- [Cardano market data](./reference/market.md) — prices, DEX, NFT, wallet PnL, aggregator,
  leaderboard, sync, blueprints (mainnet only).
- [Bitcoin](./reference/bitcoin.md) — addresses, txs, blocks, fees, mempool, chain, ordinals.
- [Midnight](./reference/midnight.md) — info, tx, dust, indexer.

## At a glance

```ts
import { NexusClient } from "@adlabs/nexus";

const nexus = new NexusClient({ apiKey: process.env.NEXUS_API_KEY! });

await nexus.cardano.addresses.utxos("addr1...");
await nexus.cardano.market.prices();
await nexus.bitcoin.chain.tip();
await nexus.midnight.info.get("undeployed");
```

Types are generated from the live OpenAPI spec; regenerate with `npm run gen:types`.
