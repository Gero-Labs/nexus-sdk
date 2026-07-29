# `nexus.cardano`

Cardano chain data — addresses, accounts, assets, blocks, epochs, network, pools, DReps,
governance, scripts, policies, transactions, and the transaction builder. Every resource
below is reached as `nexus.cardano.<resource>.<method>(...)`.

Collections resolve to arrays; single-item lookups (`byId`, `byHash`, and other lookups
documented as such) resolve to `null` on a 404. Paginated methods take a trailing
`{ page, pageSize }` options object. Market data lives under `nexus.cardano.market.*` and is
documented separately in [market.md](./market.md).

```ts
import { NexusClient } from "@adlabs/nexus";

const nexus = new NexusClient({ apiKey: process.env.NEXUS_API_KEY! });
```

## addresses

| Method | HTTP | Description |
|---|---|---|
| `cardano.addresses.get(address)` | `GET /api/addresses/{address}` | Summary for an address. |
| `cardano.addresses.utxos(address, opts?)` | `GET /api/addresses/{address}/utxos` | UTxOs at an address. |
| `cardano.addresses.utxosWithAsset(address, unit, opts?)` | `GET /api/addresses/{address}/utxos/{asset}` | UTxOs at an address holding a specific unit. |
| `cardano.addresses.credentialUtxos(credential, opts?)` | `GET /api/addresses/cred/{credential}/utxos` | UTxOs by payment credential. |
| `cardano.addresses.credentialTransactions(credential, opts?)` | `GET /api/addresses/cred/{credential}/transactions` | Transactions by payment credential. |
| `cardano.addresses.transactions(address, opts?)` | `GET /api/addresses/transactions/{address}` | Transactions involving an address. |
| `cardano.addresses.transactionHistory(address, opts?)` | `GET /api/addresses/{address}/transactions/history` | Full transaction history for an address. |
| `cardano.addresses.transactionsBySlot(address, query?)` | `GET /api/addresses/{address}/transactions/by-slot` | Transactions within a slot range (`{ fromSlot, toSlot, page, pageSize }`). |

```ts
const summary = await nexus.cardano.addresses.get("addr1...");
const utxos = await nexus.cardano.addresses.utxos("addr1...", { page: 1, pageSize: 50 });
const history = await nexus.cardano.addresses.transactionHistory("addr1...");
```

## accounts

| Method | HTTP | Description |
|---|---|---|
| `cardano.accounts.info(stakeAddress)` | `GET /api/account/{stakeAddress}/info` | Stake account summary. |
| `cardano.accounts.addresses(stakeAddress)` | `GET /api/account/{stakeAddress}/addresses` | Addresses controlled by a stake account. |
| `cardano.accounts.assets(stakeAddress, opts?)` | `GET /api/account/{stakeAddress}/assets` | Assets across a stake account (`{ policy, page, pageSize }`). |
| `cardano.accounts.rewards(stakeAddress)` | `GET /api/account/{stakeAddress}/rewards` | Reward history for a stake account. |
| `cardano.accounts.txs(stakeAddress, from)` | `GET /api/account/{stakeAddress}/txs` | Transactions since `from` (required). |
| `cardano.accounts.utxos(stakeAddress)` | `GET /api/account/{stakeAddress}/utxos` | UTxOs across a stake account's addresses. |

```ts
const info = await nexus.cardano.accounts.info("stake1...");
const rewards = await nexus.cardano.accounts.rewards("stake1...");
const txs = await nexus.cardano.accounts.txs("stake1...", "2024-01-01");
```

## assets

| Method | HTTP | Description |
|---|---|---|
| `cardano.assets.blacklist()` | `GET /api/assets/blacklist` | Blacklisted asset policy IDs. |
| `cardano.assets.detailedInfo(assetPolicy, assetName)` | `GET /api/assets/detailedInfo` | Detailed information for an asset. |
| `cardano.assets.nftAddress(assetPolicy, assetName)` | `GET /api/assets/nft-address` | Address currently holding an NFT. |
| `cardano.assets.holders(unit, opts?)` | `GET /api/assets/{unit}/holders` | Addresses currently holding an asset. |
| `cardano.assets.utxos(unit, opts?)` | `GET /api/assets/{unit}/utxos` | UTxOs currently holding an asset. |

```ts
const info = await nexus.cardano.assets.detailedInfo("policy...", "assetName");
const holders = await nexus.cardano.assets.holders("unit...", { page: 1, pageSize: 100 });
```

## blocks

| Method | HTTP | Description |
|---|---|---|
| `cardano.blocks.list(opts?)` | `GET /api/blocks` | Paginated list of recent blocks. |
| `cardano.blocks.latest()` | `GET /api/blocks/latest` | The latest block. |
| `cardano.blocks.byHash(hash)` | `GET /api/blocks/{hash}` | One block by hash; `null` if not found. |

```ts
const latest = await nexus.cardano.blocks.latest();
const block = await nexus.cardano.blocks.byHash("abc123...");
```

## epochs

| Method | HTTP | Description |
|---|---|---|
| `cardano.epochs.latest()` | `GET /api/epoch/latest` | The current epoch. |
| `cardano.epochs.latestParameters()` | `GET /api/epoch/latest/parameters` | Protocol parameters for the current epoch. |
| `cardano.epochs.params(opts?)` | `GET /api/epoch/params` | Protocol parameters for a given epoch (`{ epoch_no }`; latest when omitted). |

```ts
const epoch = await nexus.cardano.epochs.latest();
const params = await nexus.cardano.epochs.params({ epoch_no: 500 });
```

## network

| Method | HTTP | Description |
|---|---|---|
| `cardano.network.info()` | `GET /api/network/info` | Network protocol + supply information. |

```ts
const info = await nexus.cardano.network.info();
```

## pools

| Method | HTTP | Description |
|---|---|---|
| `cardano.pools.list()` | `GET /api/pools` | List stake pools. |
| `cardano.pools.byId(id)` | `GET /api/pools/{id}` | One stake pool; `null` if not found. |
| `cardano.pools.history(poolId)` | `GET /api/pools/{poolId}/history` | Reward/stake history for a pool. |
| `cardano.pools.epoch(poolId, epoch)` | `GET /api/pools/{poolId}/epochs/{epoch}` | Pool detail for a specific epoch. |
| `cardano.pools.registrations(opts?)` | `GET /api/pools/registrations` | Recent pool registrations. |
| `cardano.pools.registrationsByEpoch(epoch, opts?)` | `GET /api/pools/registrations/{epoch}` | Pool registrations in a specific epoch. |
| `cardano.pools.retirements(opts?)` | `GET /api/pools/retirements` | Recent pool retirements. |
| `cardano.pools.retiring(epoch)` | `GET /api/pools/retiring/{epoch}` | Pools retiring in a specific epoch. |

```ts
const pools = await nexus.cardano.pools.list();
const pool = await nexus.cardano.pools.byId("pool1...");
const history = await nexus.cardano.pools.history("pool1...");
```

## dreps

| Method | HTTP | Description |
|---|---|---|
| `cardano.dreps.list(opts?)` | `GET /api/dreps` | List DReps (`{ search, status, sort, page, pageSize }`). |
| `cardano.dreps.byId(drepId)` | `GET /api/dreps/{drepId}` | One DRep; `null` if not found. |
| `cardano.dreps.delegators(drepId, opts?)` | `GET /api/dreps/{drepId}/delegators` | Delegators for a DRep. |

```ts
const dreps = await nexus.cardano.dreps.list({ status: "active", pageSize: 25 });
const drep = await nexus.cardano.dreps.byId("drep1...");
```

## governance

| Method | HTTP | Description |
|---|---|---|
| `cardano.governance.committee()` | `GET /api/governance/committee` | Current constitutional committee. |
| `cardano.governance.constitution()` | `GET /api/governance/constitution` | Current on-chain constitution. |
| `cardano.governance.dreps(opts?)` | `GET /api/governance/dreps` | List governance DReps (`{ search, status, sort, hasMetadata, page, pageSize }`). |
| `cardano.governance.drep(drepId)` | `GET /api/governance/dreps/{drepId}` | One governance DRep; `null` if not found. |
| `cardano.governance.drepDelegators(drepId, opts?)` | `GET /api/governance/dreps/{drepId}/delegators` | Delegators for a governance DRep. |
| `cardano.governance.drepVotes(drepId, opts?)` | `GET /api/governance/dreps/{drepId}/votes` | Votes cast by a governance DRep. |
| `cardano.governance.proposals(opts?)` | `GET /api/governance/proposals` | List proposals (`{ type, status, page, pageSize }`). |
| `cardano.governance.proposal(govActionId)` | `GET /api/governance/proposals/{govActionId}` | One proposal; `null` if not found. |
| `cardano.governance.proposalVotes(govActionId, opts?)` | `GET /api/governance/proposals/{govActionId}/votes` | Votes on a proposal. |
| `cardano.governance.votingSummary(govActionId)` | `GET /api/governance/proposals/{govActionId}/voting-summary` | Tallied voting summary for a proposal. |

```ts
const proposals = await nexus.cardano.governance.proposals({ status: "active" });
const summary = await nexus.cardano.governance.votingSummary("gov_action1...");
const committee = await nexus.cardano.governance.committee();
```

## scripts

| Method | HTTP | Description |
|---|---|---|
| `cardano.scripts.byHash(scriptHash)` | `GET /api/scripts/{scriptHash}` | A script by hash; `null` if not found. |
| `cardano.scripts.datum(datumHash)` | `GET /api/scripts/datum/{datumHash}` | A datum by hash; `null` if not found. |

```ts
const script = await nexus.cardano.scripts.byHash("scripthash...");
const datum = await nexus.cardano.scripts.datum("datumhash...");
```

## policy

| Method | HTTP | Description |
|---|---|---|
| `cardano.policy.assets(policyId, opts?)` | `GET /api/policy/{policyId}/assets` | Assets minted under a policy. |
| `cardano.policy.utxos(policyId, opts?)` | `GET /api/policy/{policyId}/utxos` | UTxOs holding assets under a policy. |

```ts
const assets = await nexus.cardano.policy.assets("policy...", { page: 1, pageSize: 50 });
```

## transactions

| Method | HTTP | Description |
|---|---|---|
| `cardano.transactions.byHash(txHash)` | `GET /api/transactions/{txHash}` | Transaction details; `null` if not found. |
| `cardano.transactions.utxos(txHash)` | `GET /api/transactions/{txHash}/utxos` | Inputs/outputs for a transaction. |
| `cardano.transactions.cbor(txHash)` | `GET /api/transactions/{txHash}/cbor` | Raw transaction CBOR by hash. |
| `cardano.transactions.utxosBatch(body)` | `POST /api/transactions/utxos` | Batch resolve UTxOs for multiple output references. |
| `cardano.transactions.cborBatch(body)` | `POST /api/transactions/cbor` | Batch fetch raw CBOR for multiple hashes. |
| `cardano.transactions.evaluate(body)` | `POST /api/transactions/evaluate` | Evaluate redeemer execution-unit budgets. |
| `cardano.transactions.submit(cborHex)` | `POST /api/transactions/submit` | Submit a serialized tx; resolves to the tx hash (plain text). |

```ts
const tx = await nexus.cardano.transactions.byHash("txhash...");
const txHash = await nexus.cardano.transactions.submit("84a400...");
```

## txBuilder

| Method | HTTP | Description |
|---|---|---|
| `cardano.txBuilder.build(body)` | `POST /api/tx/build` | Build an unsigned transaction from a build request. |
| `cardano.txBuilder.delegation(body)` | `POST /api/tx/build/delegation` | Build a stake-delegation transaction. |
| `cardano.txBuilder.stakeRegistration(body)` | `POST /api/tx/build/stake-registration` | Build a stake-registration transaction. |
| `cardano.txBuilder.voteDelegation(body)` | `POST /api/tx/build/vote-delegation` | Build a vote-delegation transaction. |
| `cardano.txBuilder.drepRegistration(body)` | `POST /api/tx/build/drep-registration` | Build a DRep-registration transaction. |
| `cardano.txBuilder.withdrawal(body)` | `POST /api/tx/build/withdrawal` | Build a reward-withdrawal transaction. |
| `cardano.txBuilder.maxAda(body)` | `POST /api/tx/max-ada` | Compute the maximum sendable ADA for a build request. |

```ts
const built = await nexus.cardano.txBuilder.build({
  /* build request body */
});
const delegation = await nexus.cardano.txBuilder.delegation({
  /* delegation build request */
});
```
