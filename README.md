# @adlabs/nexus

TypeScript SDK for the [Nexus](https://nexus.gerowallet.io) Cardano API: a typed REST
client plus a [lucid-evolution](https://github.com/Anastasia-Labs/lucid-evolution)
provider.

## Install

```bash
npm install @adlabs/nexus @lucid-evolution/lucid
```

> **Note:** the `/lucid` adapter's type dependency (`@lucid-evolution/core-types`)
> transitively installs the Cardano multiplatform WASM libraries (~9MB). The core
> client (`@adlabs/nexus`) itself has zero runtime dependencies.

## Use with lucid-evolution

```typescript
import { Lucid } from "@lucid-evolution/lucid";
import { NexusProvider } from "@adlabs/nexus/lucid";

const lucid = await Lucid(
  new NexusProvider({ apiKey: process.env.NEXUS_API_KEY!, network: "Preprod" }),
  "Preprod",
);
```

## Use the raw client

```typescript
import { NexusClient, getAddressUtxos } from "@adlabs/nexus";

const client = new NexusClient({ apiKey: process.env.NEXUS_API_KEY!, network: "CARDANO_PREPROD" });
const utxos = await getAddressUtxos(client, "addr_test1...", 1, 100);
```

## Options

| Option | Default | Notes |
|---|---|---|
| `apiKey` | — | Nexus API key (`X-Api-Key`) |
| `network` | key's scoped network | `Mainnet` / `Preprod` / `Preview` (provider) or `CARDANO_MAINNET` / `CARDANO_PREPROD` / `CARDANO_PREVIEW` (client) |
| `baseUrl` | `https://nexus.gerowallet.io` | self-hosted Nexus deployments |
| `timeoutMs` | `30000` | per-request timeout |

## Development

```bash
npm install
npm test          # unit tests
npm run build     # ESM + CJS + d.ts
NEXUS_API_KEY=... npm test   # + live preprod integration tests
```
