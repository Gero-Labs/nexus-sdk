# @adlabs/nexus — full Nexus API client

**Date:** 2026-07-29
**Status:** Approved design
**Supersedes scope of:** [2026-07-21-nexus-sdk-lucid-provider-design.md](./2026-07-21-nexus-sdk-lucid-provider-design.md) (that work stays; this expands coverage)

## Goal

Turn `@adlabs/nexus` from a partial typed client (6 resource groups, lucid-centric
framing) into a **complete, ergonomic TypeScript client for the entire public Nexus
API** — all Cardano chain + market-data endpoints, Bitcoin, and Midnight — while keeping
the existing `NexusClient` transport and `/lucid` provider unchanged.

## Non-goals

- MCP endpoints (`/mcp/**`) — a separate protocol, out of scope.
- Internal/admin/billing routes — not in the public Swagger allowlist; never in the SDK.
- No behavior change to the existing lucid-evolution provider.
- No npm publish in this work — delivery is a PR; publishing is a separate release step.

## What stays (reused as-is)

- `NexusClient` transport (`src/client.ts`): `X-Api-Key` auth, GET retry on 5xx/network
  error, per-attempt timeout, optional `?network=`, `get`/`post`/`postText` (tx submit
  returns trimmed text). No changes needed except it becomes the injected dependency for
  every namespace.
- `NexusApiError` (`src/errors.ts`).
- `/lucid` subpath export and its provider/mappers.

## New pieces

### 1. Types generated from OpenAPI

- Add `openapi-typescript` (devDependency). Script `npm run gen:types` fetches the live
  spec (`https://nexus.gerowallet.io/v3/api-docs`, overridable via `NEXUS_OPENAPI_URL`)
  and writes `src/generated/schema.d.ts`. The generated file is **committed** so builds
  are offline/deterministic; the script is for refresh only.
- Public type names are hand-written aliases over the generated schema, e.g.
  `export type Pool = components["schemas"]["PoolDto"]`, kept in
  `src/types/<namespace>.ts`. This gives stable public names and absorbs the backend's
  per-endpoint camelCase/snake_case drift (already observed:
  `NexusOutRefUtxo` is snake_case, address-utxo DTOs are camelCase). Where the live spec
  emits an opaque schema (some proxied market-data endpoints render as `byte[]` if the
  upstream spec merge was cold at doc-gen), the alias falls back to a documented
  `unknown`/hand-written interface.
- Existing hand-written types in `src/types.ts` are retained where they are wire-verified
  (they carry real corrections from live preprod runs) and re-exported; new resources
  prefer generated aliases.

### 2. Namespaced client

`NexusClient` gains lazily-instantiated namespace accessors. Namespaces are thin wrappers
over tree-shakeable free functions (the free functions remain exported for direct import).

Three top-level namespaces:

- **`cardano`** — chain resources: `addresses`, `accounts`, `assets`, `blocks`, `epochs`,
  `network`, `pools`, `dreps`, `governance`, `scripts`, `policy`, `transactions`,
  `txBuilder`; plus a **`market`** sub-namespace (see below).
- **`bitcoin`** — `addresses`, `txs`, `blocks`, `fees`, `mempool`, `ordinals`, `chain`.
- **`midnight`** — `info`, `tx`, `dust`, `indexer` (methods take an explicit `network`
  path segment as the API requires).

```ts
const nexus = new NexusClient({ apiKey, network: "CARDANO_MAINNET" });
await nexus.cardano.addresses.utxos(addr, { page, pageSize });
await nexus.cardano.pools.list();
await nexus.cardano.governance.dreps();
await nexus.bitcoin.addresses.utxos(btcAddr);
await nexus.midnight.dust.status("undeployed", addr);
```

### 3. `cardano.market` — mainnet-scoped, guarded

The **Cardano · Market Data** group (`/api/market`, `/api/prices`, `/api/dex`,
`/api/nft`, `/api/wallet` PnL/holdings/history, `/api/aggregator`, `/api/leaderboard`,
`/api/blueprints`, `/api/sync`) lives under `cardano.market.*`:

```ts
nexus.cardano.market.prices.latest()
nexus.cardano.market.dex.recentSwaps()
nexus.cardano.market.nft.collections()
nexus.cardano.market.wallet.pnl(stake)
nexus.cardano.market.aggregator.quote(req)
```

Market data is **Cardano mainnet only**. Guard, applied in every `cardano.market.*`
method before any request:

- If the client's `network` is **explicitly set** and `!== "CARDANO_MAINNET"` → throw
  `NexusUsageError("Market data is Cardano mainnet only; client network is <network>")`.
  No request is made.
- If `network` is **unset**, the SDK cannot know the API key's scoped network, so the
  request proceeds; a wrong-network or wrong-tier key is rejected server-side and surfaces
  as a normal `NexusApiError` (e.g. 402/403).

Market methods do not send `?network=` (meaningless for this group).

### 4. `NexusUsageError`

New error class in `src/errors.ts` for client-side misuse (distinct from the
server-driven `NexusApiError`): `class NexusUsageError extends Error`. Used by the market
guard and any other precondition checks (e.g. empty required args). The existing
`throw new Error("NexusClient requires an apiKey")` is migrated to it.

## File layout

```
src/
  client.ts                 # unchanged transport + namespace accessors
  errors.ts                 # NexusApiError + NexusUsageError
  generated/schema.d.ts     # openapi-typescript output (committed)
  types/                    # hand-written public aliases per namespace
    cardano.ts  bitcoin.ts  midnight.ts  market.ts
  types.ts                  # retained wire-verified types, re-exported
  endpoints/
    cardano/  addresses.ts accounts.ts assets.ts blocks.ts epochs.ts network.ts
              pools.ts dreps.ts governance.ts scripts.ts policy.ts
              transactions.ts tx-builder.ts
    cardano/market/  market.ts prices.ts dex.ts nft.ts wallet.ts aggregator.ts
                     leaderboard.ts blueprints.ts sync.ts
    bitcoin/  addresses.ts txs.ts blocks.ts fees.ts mempool.ts ordinals.ts chain.ts
    midnight/ info.ts tx.ts dust.ts indexer.ts
  namespaces/               # thin objects wiring free fns to client.<ns>
  lucid/                    # unchanged
  index.ts                  # exports client, errors, all types + free functions
```

Free functions keep the current signature style `fn(client, ...args)`. Namespace methods
bind `client` and expose `(...args)`. Paginated list endpoints take an options object
`{ page = 1, pageSize = 100 }` with sane defaults (current code passes them positionally;
namespace methods default them).

## Error handling

- Non-2xx → `NexusApiError(status, message, code?)` (existing behavior).
- 404 on single-resource GETs that model "not found" (e.g. `getTransaction`) → return
  `null`, matching the existing transactions pattern. Applied consistently to
  single-item `get{X}` methods; list endpoints return `[]` never null.
- Client-side precondition failures → `NexusUsageError`.

## Testing

- Per-resource unit tests under `test/`, mocked `fetch` (follow existing
  `test/endpoints.test.ts` pattern): assert method → URL + query + verb, and that
  responses pass through typed. One representative test per resource minimum; market
  guard gets explicit tests (throws on preprod, allows unset/mainnet).
- Keep existing `test/integration.test.ts` gated behind `NEXUS_API_KEY` env; extend with
  a smoke call per namespace (skipped when the env var is absent).
- CI (`lint`, `typecheck`, `test`, `build`) must stay green — this is the merge gate.

## Delivery

- Branch `feat/full-api-client` on `Gero-Labs/nexus-sdk` → PR (your merge).
- `package.json` version `0.1.1 → 0.2.0`; README rewritten around the client-first API
  with per-namespace examples; the lucid section stays.
- README framing shifts from "Cardano API + lucid provider" to "the Nexus API client
  (Cardano, Bitcoin, Midnight) with an optional lucid provider".
