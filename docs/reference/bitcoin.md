# `nexus.bitcoin`

Bitcoin chain data — addresses, transactions, blocks, fee estimates, the mempool, chain tip,
and ordinals (inscriptions + runes). Every resource below is reached as
`nexus.bitcoin.<resource>.<method>(...)`.

Lookups documented as such (`byId`, `byIdOrHeight`, `hex`, and the ordinals methods) resolve
to `null` on a 404; other methods resolve to their payload.

```ts
import { NexusClient } from "@adlabs/nexus";

const nexus = new NexusClient({ apiKey: process.env.NEXUS_API_KEY! });
```

## addresses

| Method | HTTP | Description |
|---|---|---|
| `bitcoin.addresses.get(address)` | `GET /api/btc/addresses/{address}` | Address statistics (chain + mempool). |
| `bitcoin.addresses.balance(address)` | `GET /api/btc/addresses/{address}/balance` | Confirmed satoshi balance. |
| `bitcoin.addresses.utxos(address)` | `GET /api/btc/addresses/{address}/utxos` | Unspent outputs for an address. |
| `bitcoin.addresses.ordinals(address)` | `GET /api/btc/addresses/{address}/ordinals` | Inscription IDs + rune balances held at an address. |

```ts
const stats = await nexus.bitcoin.addresses.get("bc1q...");
const utxos = await nexus.bitcoin.addresses.utxos("bc1q...");
```

## txs

| Method | HTTP | Description |
|---|---|---|
| `bitcoin.txs.byId(txid)` | `GET /api/btc/txs/{txid}` | A single transaction; `null` if not found. |
| `bitcoin.txs.hex(txid)` | `GET /api/btc/txs/{txid}/hex` | Raw transaction hex; `null` if not found. |
| `bitcoin.txs.submit(body)` | `POST /api/btc/txs/submit` | Broadcast a hex-encoded signed transaction. |

```ts
const tx = await nexus.bitcoin.txs.byId("txid...");
const hex = await nexus.bitcoin.txs.hex("txid...");
```

## blocks

| Method | HTTP | Description |
|---|---|---|
| `bitcoin.blocks.recent(opts?)` | `GET /api/btc/blocks` | Most recent N blocks, descending height (`{ limit }`). |
| `bitcoin.blocks.byIdOrHeight(idOrHeight)` | `GET /api/btc/blocks/{idOrHeight}` | A block by hash or height; `null` if not found. |

```ts
const recent = await nexus.bitcoin.blocks.recent({ limit: 10 });
const block = await nexus.bitcoin.blocks.byIdOrHeight(840000);
```

## fees

| Method | HTTP | Description |
|---|---|---|
| `bitcoin.fees.estimates()` | `GET /api/btc/fees` | Fee-rate estimates (sat/vB) keyed by target block count. |

```ts
const fees = await nexus.bitcoin.fees.estimates();
```

## mempool

| Method | HTTP | Description |
|---|---|---|
| `bitcoin.mempool.snapshot()` | `GET /api/btc/mempool` | Current mempool snapshot (count, vsize, fee histogram). |

```ts
const mempool = await nexus.bitcoin.mempool.snapshot();
```

## chain

| Method | HTTP | Description |
|---|---|---|
| `bitcoin.chain.tip()` | `GET /api/btc/chain/tip` | Chain tip + sync metadata (`getblockchaininfo`). |
| `bitcoin.chain.latestBlock()` | `GET /api/btc/chain/latest-block` | The latest fully-applied block. |

```ts
const tip = await nexus.bitcoin.chain.tip();
const latest = await nexus.bitcoin.chain.latestBlock();
```

## ordinals

| Method | HTTP | Description |
|---|---|---|
| `bitcoin.ordinals.inscription(id)` | `GET /api/btc/ordinals/inscriptions/{id}` | Inscription metadata by ID; `null` if not found. |
| `bitcoin.ordinals.output(outpoint)` | `GET /api/btc/ordinals/outputs/{outpoint}` | Inscription IDs + rune balances carried by a UTxO outpoint; `null` if not found. |
| `bitcoin.ordinals.rune(rune)` | `GET /api/btc/ordinals/runes/{rune}` | Rune metadata by ID (`block:tx`) or spaced rune name; `null` if not found. |

```ts
const inscription = await nexus.bitcoin.ordinals.inscription("inscriptionId...");
const rune = await nexus.bitcoin.ordinals.rune("UNCOMMON•GOODS");
```
