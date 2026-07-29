# `nexus.midnight`

Midnight data and transaction endpoints — network info, transactions, DUST
registration/state, and the indexer GraphQL passthrough. Every resource is reached as
`nexus.midnight.<resource>.<method>(...)`.

> **`network` is the first argument.** On Midnight the network is a path segment, so every
> method takes `network` (e.g. `"undeployed"`, `"testnet"`, `"mainnet"`) as its first
> parameter rather than reading it from the client. Lookups documented as such resolve to
> `null` on a 404.

```ts
import { NexusClient } from "@adlabs/nexus";

const nexus = new NexusClient({ apiKey: process.env.NEXUS_API_KEY! });
```

## info

| Method | HTTP | Description |
|---|---|---|
| `midnight.info.get(network)` | `GET /api/midnight/{network}/info` | Network endpoints + current era for `WalletFacade.init()`. |

```ts
const info = await nexus.midnight.info.get("undeployed");
```

## tx

| Method | HTTP | Description |
|---|---|---|
| `midnight.tx.utxos(network, txHash)` | `GET /api/midnight/{network}/transactions/{txHash}/utxos` | Unshielded-UTXO view of a tx; `null` if not found. |
| `midnight.tx.buildUnshielded(network, body)` | `POST /api/midnight/{network}/tx/build-unshielded` | Build an unproven NIGHT transfer tx. |
| `midnight.tx.submit(network, body)` | `POST /api/midnight/{network}/tx/submit` | Submit a signed (unproven) tx; the sidecar finalizes. |
| `midnight.tx.submitProven(network, body)` | `POST /api/midnight/{network}/tx/submit-proven` | Submit an already-proven tx. |
| `midnight.tx.proveAndSubmit(network, body)` | `POST /api/midnight/{network}/tx/prove-and-submit` | Prove + bind + submit a shielded tx. |

```ts
const utxos = await nexus.midnight.tx.utxos("undeployed", "txhash...");
const built = await nexus.midnight.tx.buildUnshielded("undeployed", {
  /* build-unshielded body */
});
```

## dust

| Method | HTTP | Description |
|---|---|---|
| `midnight.dust.accountState(network, address)` | `GET /api/midnight/{network}/dust/account-state/{address}` | Current DUST account state; `null` if not found. |
| `midnight.dust.status(network, cardanoRewardAddress)` | `GET /api/midnight/{network}/dust/status` | DUST registration status for a single Cardano reward address. |
| `midnight.dust.registrations(network, cardanoRewardAddress)` | `GET /api/midnight/{network}/dust/registrations` | The caller's live DUST registration UTxOs. |
| `midnight.dust.stateSnapshot(network, registeredAt)` | `GET /api/midnight/{network}/dust/state-snapshot` | Dust-ledger sync-bootstrap snapshot before a registration time. |
| `midnight.dust.statusBatch(network, body)` | `POST /api/midnight/{network}/dust/status/batch` | Batch-fetch DUST status for up to 50 reward addresses. |
| `midnight.dust.buildRegistrationTx(network, body)` | `POST /api/midnight/{network}/dust/build-registration-tx` | Build the unsigned DUST registration Cardano tx. |
| `midnight.dust.buildDeregistrationTx(network, body)` | `POST /api/midnight/{network}/dust/build-deregistration-tx` | Build the unsigned DUST deregistration Cardano tx. |
| `midnight.dust.buildUpdateTx(network, body)` | `POST /api/midnight/{network}/dust/build-update-tx` | Build the unsigned DUST mapping update Cardano tx. |
| `midnight.dust.buildNightRegistration(network, body)` | `POST /api/midnight/{network}/dust/build-night-registration` | Build the Midnight-native DUST registration tx (Path A). |
| `midnight.dust.submitNightRegistration(network, body)` | `POST /api/midnight/{network}/dust/submit-night-registration` | Submit the wallet-signed Midnight DUST registration tx. |

```ts
const status = await nexus.midnight.dust.status("undeployed", "stake1...");
const state = await nexus.midnight.dust.accountState("undeployed", "mn_addr...");
```

## indexer

| Method | HTTP | Description |
|---|---|---|
| `midnight.indexer.graphql(network, body)` | `POST /api/midnight/{network}/indexer/graphql` | Forward a GraphQL query to the Midnight indexer. |

```ts
const result = await nexus.midnight.indexer.graphql("undeployed", {
  query: "{ block { height } }",
});
```
