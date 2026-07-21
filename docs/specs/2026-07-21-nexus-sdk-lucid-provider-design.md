# @adlabs/nexus — SDK with lucid-evolution Provider

**Date**: 2026-07-21
**Status**: Approved
**Repo**: `Gero-Labs/nexus-sdk` (private until first npm publish)

## Goal

Let dApp developers use Nexus as their data/submit provider in
[lucid-evolution](https://github.com/Anastasia-Labs/lucid-evolution), exactly the way they
use Blockfrost, Maestro, or Kupmios today — plus a general typed REST client for the Nexus
API that the provider is built on.

No Nexus backend changes required: every method of lucid's `Provider` interface maps to an
existing Nexus endpoint (verified against `Gero-Labs/nexus` controllers, 2026-07-21).

## Package

- **Name**: `@adlabs/nexus`
- **Entry points** (subpath exports):
  - `@adlabs/nexus` — `NexusClient` typed REST client + DTO types
  - `@adlabs/nexus/lucid` — `NexusProvider` implementing lucid-evolution's `Provider`
- **Dependencies**: `@lucid-evolution/core-types` (types only, imported solely by the
  `/lucid` subpath). Zero runtime deps in the core client (native `fetch`, Node >= 20 /
  browser).
- **DevDependencies**: `@lucid-evolution/lucid` (integration tests), tsup, vitest, eslint,
  typescript, changesets.
- **Build**: tsup → ESM + CJS + `.d.ts`. Dual-format so both bundlers and Node CJS users work.

## Architecture

```
nexus-sdk/
  src/
    client.ts        # NexusClient: fetch wrapper — apiKey header, baseUrl, network param,
                     # timeout, bounded retries (idempotent GETs only), NexusApiError
    types.ts         # Nexus DTO types (mirrored from Java DTOs, hand-verified)
    endpoints/
      addresses.ts   # utxos, utxos-by-asset, cred utxos, datum
      account.ts     # stake account info (delegation, rewards)
      assets.ts      # asset utxo locations
      transactions.ts# by-hash, submit, evaluate, utxos-by-outref
      epoch.ts       # protocol parameters
      scripts.ts     # script by hash, datum by hash
    lucid/
      provider.ts    # NexusProvider implements Provider (from @lucid-evolution/core-types)
      mappers.ts     # Nexus DTOs → lucid UTxO / ProtocolParameters / Delegation / EvalRedeemer
      index.ts
    index.ts
  test/
    mappers.test.ts    # pure unit tests against captured JSON fixtures
    provider.test.ts   # NexusProvider against mocked NexusClient
    integration.test.ts# env-gated (NEXUS_API_KEY + NEXUS_BASE_URL): live preprod smoke
  docs/specs/          # this file
  .github/workflows/ci.yml  # lint + typecheck + unit tests on PR; publish on tag
```

### NexusClient

- Constructor: `{ apiKey, baseUrl?, network?, timeoutMs? }`.
  - `baseUrl` defaults to `https://nexus.gerowallet.io`.
  - `network` (e.g. `MAINNET`, `PREPROD`) sent as `?network=` on every request —
    matches Nexus `NetworkResolver` (falls back to the API key's scoped network when omitted).
- Auth: `X-Api-Key` header.
- Errors: non-2xx → `NexusApiError { status, code?, message }`. Message comes from the
  Nexus error envelope only — never raw body dumps, never internal details.
- Retries: GET only, max 2, exponential backoff, on 5xx/network errors. Never retry
  submit/evaluate.

### NexusProvider (lucid adapter)

Implements the `Provider` interface from `@lucid-evolution/core-types`:

| Provider method | Nexus endpoint | Notes |
|---|---|---|
| `getProtocolParameters()` | `GET /api/epoch/params` | map to lucid `ProtocolParameters` incl. cost models |
| `getUtxos(addressOrCredential)` | `GET /api/addresses/{address}/utxos` / `GET /api/addresses/cred/{credential}/utxos` | paginated (`page`/`pageSize`, max 100) — loop until short page |
| `getUtxosWithUnit(addrOrCred, unit)` | `GET /api/addresses/{address}/utxos/{asset}` | |
| `getUtxoByUnit(unit)` | `GET /api/assets/{unit}/utxos` | throw if 0 or >1 holders (lucid contract) |
| `getUtxosByOutRef(outRefs)` | `POST /api/transactions/utxos` | ≤100 per call — chunk larger inputs |
| `getDelegation(rewardAddress)` | `GET /api/account/{stakeAddress}/info` | `{ poolId, rewards }` |
| `getDatum(datumHash)` | `GET /api/scripts/datum/{datumHash}` | returns datum CBOR |
| `awaitTx(txHash, checkInterval?)` | poll `GET /api/transactions/{txHash}` | default interval 3s, cap total wait |
| `submitTx(tx)` | `POST /api/transactions/submit` | CBOR hex body; surface node error message |
| `evaluateTx(tx, additionalUTxOs?)` | `POST /api/transactions/evaluate` | map to `EvalRedeemer[]` |

Constructor: `new NexusProvider({ apiKey, network, baseUrl? })` — thin wrapper that owns a
`NexusClient` and the mappers. Network string accepts lucid-style names
(`"Mainnet" | "Preprod" | "Preview"`) and maps to Nexus enum values.

### Mappers

Pure functions, one per lucid type, unit-tested against JSON fixtures captured from the
real Nexus API (preprod). DTO field names verified against Java DTO classes in
`Gero-Labs/nexus` during implementation — no guessed shapes. Key conversions:

- Amounts/quantities → `bigint` (lucid `Assets` is `Record<Unit, bigint>`).
- Datum handling: distinguish `datumHash` vs inline `datum` per lucid `UTxO` contract.
- Script refs → lucid `Script` (`{ type: "PlutusV1"|"PlutusV2"|"PlutusV3"|"Native", script }`).
- Cost models keyed per Plutus version as lucid expects.

## Error handling

- All provider methods throw `NexusApiError` (or lucid-conventional `Error` with a clear
  message for contract violations like `getUtxoByUnit` multiplicity).
- `awaitTx` resolves `true` on confirmation; keeps polling until confirmed (caller-driven
  cancellation via lucid's own usage; interval configurable).
- No sensitive data (API key, raw responses) in error messages or logs.

## Testing

1. **Unit**: mappers with fixtures; provider with mocked client (vitest).
2. **Integration** (env-gated, skipped without `NEXUS_API_KEY`): against preprod —
   read paths for a known address, `evaluateTx` on a prebuilt tx, full lucid round-trip
   (build + sign + submit self-send) as a manual/nightly job, not per-PR.
3. **CI**: GitHub Actions — lint, typecheck, unit tests on PR. Publish workflow on version
   tag via changesets (`npm publish --access public` once repo goes public).

## Out of scope (YAGNI)

- Blockfrost-compatible endpoint layer on Nexus.
- Mesh/CardanoJS adapters (structure leaves room: `src/mesh/` later).
- Bitcoin/Midnight Nexus surfaces.
- WebSocket/streaming support.
