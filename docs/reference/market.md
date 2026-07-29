# `nexus.cardano.market`

Cardano market data — token prices and candles, DEX pools/orders/swaps, NFT collections,
wallet PnL, the swap aggregator, the trader leaderboard, indexer sync status, and DApp
blueprints. The token-level price methods live directly on `nexus.cardano.market.*`; the rest
are grouped into sub-namespaces (`candles`, `dex`, `nft`, `wallet`, `aggregator`,
`leaderboard`, `sync`, `blueprints`).

> **Mainnet only.** Market data is served from Cardano mainnet. If the client was constructed
> with an explicit non-mainnet `network`, every `market` call throws `NexusUsageError` before
> making a request. With no `network` set, the call proceeds and a wrong-network or
> wrong-tier API key is rejected server-side as a `NexusApiError`.

Collections resolve to arrays; lookups documented as such resolve to `null` on a 404.

```ts
import { NexusClient } from "@adlabs/nexus";

// Omit `network` (or set CARDANO_MAINNET) so market calls are allowed.
const nexus = new NexusClient({ apiKey: process.env.NEXUS_API_KEY! });
```

## market (token prices)

Methods bound directly on `nexus.cardano.market.*`.

| Method | HTTP | Description |
|---|---|---|
| `market.tokens()` | `GET /api/market/tokens` | Tracked asset identifiers. |
| `market.tokenMetadata(assetId)` | `GET /api/market/tokens/{assetId}/metadata` | Token metadata; `null` if not found. |
| `market.prices()` | `GET /api/market/prices` | Latest prices for all tracked tokens. |
| `market.price(assetId)` | `GET /api/market/prices/{assetId}` | Latest price for a token; `null` if not found. |
| `market.priceAllSources(assetId)` | `GET /api/market/prices/{assetId}/all` | Price from every source for a token. |
| `market.topVolume(opts?)` | `GET /api/market/prices/top-volume` | Tokens ranked by trading volume (`{ limit }`). |
| `market.topTvl(opts?)` | `GET /api/market/prices/top-tvl` | Tokens ranked by total value locked (`{ limit }`). |
| `market.history(assetId, from, to)` | `GET /api/market/history/{assetId}` | Price history over a time range (both required). |
| `market.historyAt(assetId, time)` | `GET /api/market/history/{assetId}/at` | Price at a point in time; `null` if not found. |
| `market.ada()` | `GET /api/market/ada` | Current ADA price. |

```ts
const prices = await nexus.cardano.market.prices();
const one = await nexus.cardano.market.price("assetId...");
const top = await nexus.cardano.market.topVolume({ limit: 20 });
```

## candles

`nexus.cardano.market.candles.*` — OHLC candles, latest prices by symbol, and RSI.

| Method | HTTP | Description |
|---|---|---|
| `market.candles.latest(opts?)` | `GET /api/prices/latest` | Latest prices for symbols (`{ symbols }`; all when omitted). |
| `market.candles.rsi(opts?)` | `GET /api/prices/rsi` | RSI entries at a resolution (`{ resolution }`). |
| `market.candles.adaCandles(opts?)` | `GET /api/prices/ada/candles` | ADA OHLC candles (`{ currency, resolution, from, to }`). |
| `market.candles.historicalCandles(assetId, opts?)` | `GET /api/prices/historical/candles` | OHLC candles for a token pair (`{ quoteAssetId, resolution, from, to, currency }`). |

```ts
const latest = await nexus.cardano.market.candles.latest({ symbols: ["ADA", "MIN"] });
const candles = await nexus.cardano.market.candles.adaCandles({ resolution: "1h" });
```

## dex

`nexus.cardano.market.dex.*` — liquidity pools, order books, orders, quotes, swaps, and top
traders. Order-history listings take `{ status, page, size }`.

| Method | HTTP | Description |
|---|---|---|
| `market.dex.pools()` | `GET /api/dex/pools` | All liquidity pools. |
| `market.dex.pool(poolId)` | `GET /api/dex/pools/{poolId}` | A liquidity pool; `null` if not found. |
| `market.dex.poolsByDex(dex)` | `GET /api/dex/pools/dex/{dex}` | Pools for a specific DEX. |
| `market.dex.poolsByToken(policyId, assetName)` | `GET /api/dex/pools/token/{policyId}/{assetName}` | Pools containing a token. |
| `market.dex.poolsPair(tokenAPolicyId, tokenAAssetName, tokenBPolicyId, tokenBAssetName)` | `GET /api/dex/pools/pair` | Pools trading a specific token pair. |
| `market.dex.poolsTopTvl(opts?)` | `GET /api/dex/pools/top-tvl` | Pools ranked by TVL (`{ limit }`). |
| `market.dex.orderbook(poolId, opts?)` | `GET /api/dex/orderbook/{poolId}` | Aggregated order book (`{ levels, showCrossed, showOutliers }`). |
| `market.dex.orderbookSimulated(poolId, opts?)` | `GET /api/dex/orderbook/{poolId}/simulated` | Simulated order book (`{ levels }`). |
| `market.dex.order(txHash, outputIndex)` | `GET /api/dex/orders/{txHash}/{outputIndex}` | A DEX order by output ref; `null` if not found. |
| `market.dex.ordersByDex(dex, opts?)` | `GET /api/dex/orders/dex/{dex}` | Order history for a DEX. |
| `market.dex.ordersByOwner(pkh, opts?)` | `GET /api/dex/orders/owner/{pkh}` | Order history for an owner payment key hash. |
| `market.dex.ordersByToken(policyId, assetName, opts?)` | `GET /api/dex/orders/token/{policyId}/{assetName}` | Order history for a token. |
| `market.dex.quoteBuy(poolId, amountIn)` | `GET /api/dex/quote/buy` | Quote for buying from a pool. |
| `market.dex.quoteSell(poolId, amountIn)` | `GET /api/dex/quote/sell` | Quote for selling into a pool. |
| `market.dex.swapsRecent(opts?)` | `GET /api/dex/swaps/recent` | Recent swaps across DEXes (`{ limit, dex, status }`). |
| `market.dex.swapsByToken(policyId, assetName, opts?)` | `GET /api/dex/swaps/token/{policyId}/{assetName}` | Recent swaps for a token (`{ limit }`). |
| `market.dex.topTraders(policyId, assetName, opts?)` | `GET /api/dex/tokens/{policyId}/{assetName}/top-traders` | Top traders of a token (`{ limit }`). |

```ts
const pools = await nexus.cardano.market.dex.pools();
const book = await nexus.cardano.market.dex.orderbook("poolId...", { levels: 10 });
const quote = await nexus.cardano.market.dex.quoteBuy("poolId...", 1_000_000);
```

## nft

`nexus.cardano.market.nft.*` — collection stats, floors, sales, and per-asset prices.

| Method | HTTP | Description |
|---|---|---|
| `market.nft.collections(opts?)` | `GET /api/nft/collections` | NFT collection stats (`{ sort, limit }`). |
| `market.nft.collection(policyId)` | `GET /api/nft/collection/{policyId}` | Stats for one collection; `null` if not found. |
| `market.nft.floor(policyId)` | `GET /api/nft/collection/{policyId}/floor` | Floor price for a collection; `null` if not found. |
| `market.nft.sales(policyId, opts?)` | `GET /api/nft/collection/{policyId}/sales` | Recent sales for a collection (`{ limit }`). |
| `market.nft.assetPrice(policyId, assetName)` | `GET /api/nft/asset/{policyId}/{assetName}/price` | Price for one NFT asset; `null` if not found. |

```ts
const collections = await nexus.cardano.market.nft.collections({ sort: "volume", limit: 10 });
const floor = await nexus.cardano.market.nft.floor("policy...");
```

## wallet

`nexus.cardano.market.wallet.*` — per-wallet PnL, holdings, portfolio history, and
multi-wallet FIFO PnL.

| Method | HTTP | Description |
|---|---|---|
| `market.wallet.pnl(stakeAddress)` | `GET /api/wallet/{stakeAddress}/pnl` | Realized/unrealized P&L for a wallet. |
| `market.wallet.holdings(stakeAddress)` | `GET /api/wallet/{stakeAddress}/holdings` | Current token holdings for a wallet. |
| `market.wallet.history(stakeAddress, opts?)` | `GET /api/wallet/{stakeAddress}/history` | Portfolio value history (`{ resolution, adaOnly }`). |
| `market.wallet.multiPnl(body)` | `POST /api/wallet/pnl` | FIFO P&L aggregated across multiple wallets. |

```ts
const pnl = await nexus.cardano.market.wallet.pnl("stake1...");
const holdings = await nexus.cardano.market.wallet.holdings("stake1...");
```

## aggregator

`nexus.cardano.market.aggregator.*` — the swap aggregator: routable tokens, supported DEXes,
order status, and quote endpoints.

| Method | HTTP | Description |
|---|---|---|
| `market.aggregator.tokens()` | `GET /api/aggregator/tokens` | Tokens routable through the aggregator. |
| `market.aggregator.supportedDexes()` | `GET /api/aggregator/supported-dexes` | DEXes the aggregator can route across. |
| `market.aggregator.status(txHash)` | `GET /api/aggregator/status/{txHash}` | Aggregator order status; `null` if not found. |
| `market.aggregator.quote(body)` | `POST /api/aggregator/quote` | Best-route swap quote for an exact input amount. |
| `market.aggregator.quoteRoutes(body)` | `POST /api/aggregator/quote/routes` | Candidate routes for a swap quote. |
| `market.aggregator.reverseQuote(body)` | `POST /api/aggregator/reverse-quote` | Exact-out quote (least input for a desired output). |

```ts
const dexes = await nexus.cardano.market.aggregator.supportedDexes();
const quote = await nexus.cardano.market.aggregator.quote({
  /* quote request body */
});
```

## leaderboard

`nexus.cardano.market.leaderboard.*` — the trader leaderboard.

| Method | HTTP | Description |
|---|---|---|
| `market.leaderboard.list(opts?)` | `GET /api/leaderboard` | Trader leaderboard (`{ limit, offset }`). |
| `market.leaderboard.stats()` | `GET /api/leaderboard/stats` | Aggregate leaderboard statistics. |

```ts
const board = await nexus.cardano.market.leaderboard.list({ limit: 50 });
const stats = await nexus.cardano.market.leaderboard.stats();
```

## sync

`nexus.cardano.market.sync.*` — market-data indexer sync status.

| Method | HTTP | Description |
|---|---|---|
| `market.sync.status()` | `GET /api/sync/status` | Market-data indexer sync status. |

```ts
const status = await nexus.cardano.market.sync.status();
```

## blueprints

`nexus.cardano.market.blueprints.*` — registered DApp blueprints and their emitted events.

| Method | HTTP | Description |
|---|---|---|
| `market.blueprints.list()` | `GET /api/blueprints` | Registered DApp blueprints. |
| `market.blueprints.byId(id)` | `GET /api/blueprints/{id}` | A blueprint; `null` if not found. |
| `market.blueprints.events(id, opts?)` | `GET /api/blueprints/{id}/events` | Persisted events (`{ page, size, phase, sinceId, fromSlot }`). |
| `market.blueprints.create(body)` | `POST /api/blueprints` | Register a new blueprint. |
| `market.blueprints.remove(id)` | `DELETE /api/blueprints/{id}` | Remove a registered blueprint. |

```ts
const blueprints = await nexus.cardano.market.blueprints.list();
const events = await nexus.cardano.market.blueprints.events("id...", { size: 100 });
```
