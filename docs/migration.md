# Migrating to Nexus

There are two migration paths. Pick the one that matches how you use your current tool.

1. **You build transactions with lucid-evolution or Mesh** → swap the *provider*. Near
   zero-friction — see [Drop-in provider swap](#1-drop-in-provider-swap).
2. **You query chain data directly** with the Blockfrost SDK, a Koios client, or raw REST
   → move to the `@adlabs/nexus` client. This is a rewrite of call sites (different method
   names and response shapes), eased by the maps below.

> Third-party method/endpoint names below reflect those tools at the time of writing. Verify
> against their current docs — the Nexus column is authoritative for this SDK.

---

## 1. Drop-in provider swap

If your app already targets a framework provider abstraction, you don't need this SDK's raw
client at all — use the native Nexus provider and change one line.

### lucid-evolution

```ts
// before
import { Blockfrost } from "@lucid-evolution/lucid";
const provider = new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0", projectId);

// after — native Nexus provider (Anastasia-Labs/lucid-evolution#722)
import { Nexus } from "@lucid-evolution/lucid";
const provider = new Nexus({ apiKey: process.env.NEXUS_API_KEY! });
```

### Mesh

```ts
// before
import { BlockfrostProvider } from "@meshsdk/core";
const provider = new BlockfrostProvider(projectId);

// after — NexusProvider (MeshJS/providers)
import { NexusProvider } from "@meshsdk/provider";
const provider = new NexusProvider({ apiKey: process.env.NEXUS_API_KEY! });
```

The provider implements the same `IFetcher` / `IEvaluator` / `ISubmitter` (Mesh) or
`Provider` (lucid) interface your code already calls — no other changes.

This SDK also ships its own lucid adapter at `@adlabs/nexus/lucid` (see the
[README](../README.md#use-with-lucid-evolution)); prefer the framework-native provider when
it is available.

---

## 2. From the Blockfrost SDK (`@blockfrost/blockfrost-js`)

Same resources, different surface. Construct the client once:

```ts
// before
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
const bf = new BlockFrostAPI({ projectId: process.env.BLOCKFROST_PROJECT_ID! });

// after
import { NexusClient } from "@adlabs/nexus";
const nexus = new NexusClient({ apiKey: process.env.NEXUS_API_KEY! });
```

| Blockfrost SDK | Nexus |
|---|---|
| `bf.addresses(addr)` | `nexus.cardano.addresses.get(addr)` |
| `bf.addressesUtxos(addr)` | `nexus.cardano.addresses.utxos(addr)` |
| `bf.addressesUtxosAsset(addr, unit)` | `nexus.cardano.addresses.utxosWithAsset(addr, unit)` |
| `bf.addressesTransactions(addr)` | `nexus.cardano.addresses.transactions(addr)` |
| `bf.accounts(stake)` | `nexus.cardano.accounts.info(stake)` |
| `bf.accountsRewards(stake)` | `nexus.cardano.accounts.rewards(stake)` |
| `bf.accountsAddresses(stake)` | `nexus.cardano.accounts.addresses(stake)` |
| `bf.accountsAddressesAssets(stake)` | `nexus.cardano.accounts.assets(stake)` |
| `bf.assetsById(unit)` | `nexus.cardano.assets.detailedInfo(policy, name)` ¹ |
| `bf.assetsAddresses(unit)` → holders | `nexus.cardano.assets.holders(unit)` |
| `bf.assetsPolicyById(policy)` | `nexus.cardano.policy.assets(policy)` |
| `bf.blocksLatest()` | `nexus.cardano.blocks.latest()` |
| `bf.blocks(hashOrNumber)` | `nexus.cardano.blocks.byHash(hash)` |
| `bf.epochsLatest()` | `nexus.cardano.epochs.latest()` |
| `bf.epochsLatestParameters()` | `nexus.cardano.epochs.latestParameters()` |
| `bf.epochsParameters(n)` | `nexus.cardano.epochs.params({ epoch_no: n })` |
| `bf.txs(hash)` | `nexus.cardano.transactions.byHash(hash)` |
| `bf.txsUtxos(hash)` | `nexus.cardano.transactions.utxos(hash)` |
| `bf.pools()` | `nexus.cardano.pools.list()` |
| `bf.poolsById(pool)` | `nexus.cardano.pools.byId(pool)` |
| `bf.poolsByIdHistory(pool)` | `nexus.cardano.pools.history(pool)` |
| `bf.scriptsByHash(hash)` | `nexus.cardano.scripts.byHash(hash)` |
| `bf.scriptsDatum(datumHash)` | `nexus.cardano.scripts.datum(datumHash)` |
| `bf.network()` | `nexus.cardano.network.info()` |
| `bf.governanceDreps()` | `nexus.cardano.governance.dreps()` |
| `bf.governanceDrepsByDrep(id)` | `nexus.cardano.governance.drep(id)` |
| `bf.governanceProposals()` | `nexus.cardano.governance.proposals()` |
| `bf.txSubmit(cbor)` | `nexus.cardano.transactions.submit(cbor)` |
| `bf.utilsTxsEvaluate(cbor)` | `nexus.cardano.transactions.evaluate(cbor)` |

¹ Nexus splits the asset identifier into policy id + asset name rather than a single
concatenated `unit`.

### Behavioural differences

- **Auth:** `X-Api-Key` (Nexus) vs `project_id` (Blockfrost) — handled by the client options.
- **Pagination:** `{ page, pageSize }` (Nexus) vs `{ page, count }` (Blockfrost). Nexus
  defaults to `page 1, pageSize 100`. See [pagination](./pagination.md).
- **Response shapes differ.** Nexus returns its own DTOs (generated types under
  `components["schemas"]`), not the Blockfrost response schema. Field names and nesting are
  not identical — adapt your read code. See [getting-started › Types](./getting-started.md#types).
- **Not found:** single-item lookups return `null` on 404 instead of throwing. See
  [errors](./errors.md).
- **No `unit`-string helpers:** pass policy id and asset name separately where noted.

---

## 3. From Koios

Koios is a PostgREST-style REST/RPC surface (GET with filters, POST for bulk). Nexus exposes
purpose-built endpoints instead, so this is a rewrite of both calls and response handling.

| Koios endpoint | Nexus |
|---|---|
| `/address_info` | `nexus.cardano.addresses.get(addr)` |
| `/address_utxos` | `nexus.cardano.addresses.utxos(addr)` |
| `/address_txs` | `nexus.cardano.addresses.transactions(addr)` |
| `/credential_utxos` | `nexus.cardano.addresses.credentialUtxos(cred)` |
| `/account_info` | `nexus.cardano.accounts.info(stake)` |
| `/account_rewards` | `nexus.cardano.accounts.rewards(stake)` |
| `/account_addresses` | `nexus.cardano.accounts.addresses(stake)` |
| `/account_assets` | `nexus.cardano.accounts.assets(stake)` |
| `/account_utxos` | `nexus.cardano.accounts.utxos(stake)` |
| `/asset_info` | `nexus.cardano.assets.detailedInfo(policy, name)` |
| `/asset_addresses` | `nexus.cardano.assets.holders(unit)` |
| `/policy_asset_list` | `nexus.cardano.policy.assets(policy)` |
| `/blocks` | `nexus.cardano.blocks.list()` |
| `/block_info` | `nexus.cardano.blocks.byHash(hash)` |
| `/epoch_info` | `nexus.cardano.epochs.latest()` / `params({ epoch_no })` |
| `/epoch_params` | `nexus.cardano.epochs.latestParameters()` |
| `/tx_info` | `nexus.cardano.transactions.byHash(hash)` |
| `/tx_utxos` | `nexus.cardano.transactions.utxos(hash)` |
| `/pool_list` | `nexus.cardano.pools.list()` |
| `/pool_info` | `nexus.cardano.pools.byId(pool)` |
| `/pool_history` | `nexus.cardano.pools.history(pool)` |
| `/pool_delegators` | (see reference) |
| `/script_info` | `nexus.cardano.scripts.byHash(hash)` |
| `/datum_info` | `nexus.cardano.scripts.datum(datumHash)` |
| `/drep_list` | `nexus.cardano.dreps.list()` |
| `/drep_info` | `nexus.cardano.dreps.byId(id)` |
| `/drep_delegators` | `nexus.cardano.dreps.delegators(id)` |
| `/proposal_list` | `nexus.cardano.governance.proposals()` |
| `/committee_info` | `nexus.cardano.governance.committee()` |
| `/constitution` | `nexus.cardano.governance.constitution()` |
| `/tip` | `nexus.cardano.network.info()` |
| `/submittx` | `nexus.cardano.transactions.submit(cbor)` |

Koios's horizontal filtering (`?select=`, `?order=`, header-based ranges) has no direct
equivalent — use the endpoint's typed options and paginate with `{ page, pageSize }`.

---

## 4. What Nexus adds beyond Blockfrost / Koios

No migration needed — these are net-new once you're on the client:

- **Cardano market data** — token prices, DEX pools/swaps, NFT floors, wallet PnL, the swap
  aggregator (`nexus.cardano.market.*`, mainnet only). See [market](./reference/market.md).
- **Bitcoin** — addresses, txs, blocks, fees, mempool, ordinals (`nexus.bitcoin.*`).
- **Midnight** — info, transactions, DUST, indexer (`nexus.midnight.*`).
- **Transaction builder** — server-side delegation / registration / vote / withdrawal builds
  (`nexus.cardano.txBuilder.*`).

---

## Checklist

- [ ] Swap the client/provider constructor and set `NEXUS_API_KEY`.
- [ ] If on lucid/Mesh, use the native provider (§1) and stop here.
- [ ] Otherwise, rename call sites using §2 / §3.
- [ ] Update pagination params (`count` → `pageSize`).
- [ ] Adapt to Nexus response DTOs (`components["schemas"]`), not the old response schema.
- [ ] Replace 404 try/catch with `=== null` checks on single-item lookups.
