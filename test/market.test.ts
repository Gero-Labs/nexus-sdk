import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusClient } from "../src/client.js";
import { NexusUsageError } from "../src/errors.js";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

// Market data is mainnet-only. A client with no network passes the guard (server decides),
// which keeps these URL assertions free of an appended ?network= param.
const client = new NexusClient({ apiKey: "k", retryDelaysMs: [] });

const BASE = "https://nexus.gerowallet.io";

afterEach(() => vi.restoreAllMocks());

const spyOk = (body: unknown = []) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(body));

const url = (spy: ReturnType<typeof spyOk>, i = 0) => String(spy.mock.calls[i]![0]);

// ---------------------------------------------------------------------------
// client.cardano.market.* (bindMarket)
// ---------------------------------------------------------------------------
describe("cardano.market (bindMarket)", () => {
  it("tokens", async () => {
    const spy = spyOk();
    await client.cardano.market.tokens();
    expect(url(spy)).toBe(`${BASE}/api/market/tokens`);
  });

  it("tokenMetadata", async () => {
    const spy = spyOk({});
    await client.cardano.market.tokenMetadata("policy.asset");
    expect(url(spy)).toBe(`${BASE}/api/market/tokens/policy.asset/metadata`);
  });

  it("tokenMetadata → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.tokenMetadata("missing")).toBeNull();
  });

  it("prices", async () => {
    const spy = spyOk();
    await client.cardano.market.prices();
    expect(url(spy)).toBe(`${BASE}/api/market/prices`);
  });

  it("price", async () => {
    const spy = spyOk({});
    await client.cardano.market.price("asset1");
    expect(url(spy)).toBe(`${BASE}/api/market/prices/asset1`);
  });

  it("price → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.price("missing")).toBeNull();
  });

  it("priceAllSources", async () => {
    const spy = spyOk();
    await client.cardano.market.priceAllSources("asset1");
    expect(url(spy)).toBe(`${BASE}/api/market/prices/asset1/all`);
  });

  it("topVolume with limit", async () => {
    const spy = spyOk();
    await client.cardano.market.topVolume({ limit: 5 });
    expect(url(spy)).toBe(`${BASE}/api/market/prices/top-volume?limit=5`);
  });

  it("topVolume without opts omits limit", async () => {
    const spy = spyOk();
    await client.cardano.market.topVolume();
    expect(url(spy)).toBe(`${BASE}/api/market/prices/top-volume`);
  });

  it("topTvl with limit", async () => {
    const spy = spyOk();
    await client.cardano.market.topTvl({ limit: 3 });
    expect(url(spy)).toBe(`${BASE}/api/market/prices/top-tvl?limit=3`);
  });

  it("history with from/to", async () => {
    const spy = spyOk();
    await client.cardano.market.history("asset1", "2024-01-01", "2024-02-01");
    const u = url(spy);
    expect(u).toContain("/api/market/history/asset1");
    expect(u).toContain("from=2024-01-01");
    expect(u).toContain("to=2024-02-01");
  });

  it("historyAt with time", async () => {
    const spy = spyOk({});
    await client.cardano.market.historyAt("asset1", "2024-01-01T00:00:00Z");
    const u = url(spy);
    expect(u).toContain("/api/market/history/asset1/at");
    expect(u).toContain("time=2024-01-01");
  });

  it("historyAt → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.historyAt("asset1", "t")).toBeNull();
  });

  it("ada", async () => {
    const spy = spyOk({});
    await client.cardano.market.ada();
    expect(url(spy)).toBe(`${BASE}/api/market/ada`);
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.candles.* (bindPrices / prices.ts)
// ---------------------------------------------------------------------------
describe("cardano.market.candles (bindPrices)", () => {
  it("latest joins symbols", async () => {
    const spy = spyOk();
    await client.cardano.market.candles.latest({ symbols: ["ADA", "MIN"] });
    const u = url(spy);
    expect(u).toContain("/api/prices/latest");
    expect(u).toContain("symbols=ADA%2CMIN");
  });

  it("latest without opts", async () => {
    const spy = spyOk();
    await client.cardano.market.candles.latest();
    expect(url(spy)).toBe(`${BASE}/api/prices/latest`);
  });

  it("rsi with resolution", async () => {
    const spy = spyOk();
    await client.cardano.market.candles.rsi({ resolution: "1h" });
    expect(url(spy)).toBe(`${BASE}/api/prices/rsi?resolution=1h`);
  });

  it("adaCandles with all params", async () => {
    const spy = spyOk();
    await client.cardano.market.candles.adaCandles({
      currency: "USD",
      resolution: "1d",
      from: 100,
      to: 200,
    });
    const u = url(spy);
    expect(u).toContain("/api/prices/ada/candles");
    expect(u).toContain("currency=USD");
    expect(u).toContain("resolution=1d");
    expect(u).toContain("from=100");
    expect(u).toContain("to=200");
  });

  it("historicalCandles passes assetId + opts", async () => {
    const spy = spyOk();
    await client.cardano.market.candles.historicalCandles("assetA", {
      quoteAssetId: "assetB",
      resolution: "1h",
      from: 1,
      to: 2,
      currency: "ADA",
    });
    const u = url(spy);
    expect(u).toContain("/api/prices/historical/candles");
    expect(u).toContain("assetId=assetA");
    expect(u).toContain("quoteAssetId=assetB");
    expect(u).toContain("resolution=1h");
    expect(u).toContain("currency=ADA");
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.dex.* (bindDex)
// ---------------------------------------------------------------------------
describe("cardano.market.dex (bindDex)", () => {
  it("pools", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.pools();
    expect(url(spy)).toBe(`${BASE}/api/dex/pools`);
  });

  it("pool", async () => {
    const spy = spyOk({});
    await client.cardano.market.dex.pool("pool1");
    expect(url(spy)).toBe(`${BASE}/api/dex/pools/pool1`);
  });

  it("pool → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.dex.pool("nope")).toBeNull();
  });

  it("poolsByDex", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.poolsByDex("minswap");
    expect(url(spy)).toBe(`${BASE}/api/dex/pools/dex/minswap`);
  });

  it("poolsByToken", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.poolsByToken("pol1", "name1");
    expect(url(spy)).toBe(`${BASE}/api/dex/pools/token/pol1/name1`);
  });

  it("poolsPair passes all four query params", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.poolsPair("pA", "nA", "pB", "nB");
    const u = url(spy);
    expect(u).toContain("/api/dex/pools/pair");
    expect(u).toContain("tokenAPolicyId=pA");
    expect(u).toContain("tokenAAssetName=nA");
    expect(u).toContain("tokenBPolicyId=pB");
    expect(u).toContain("tokenBAssetName=nB");
  });

  it("poolsTopTvl with limit", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.poolsTopTvl({ limit: 10 });
    expect(url(spy)).toBe(`${BASE}/api/dex/pools/top-tvl?limit=10`);
  });

  it("orderbook stringifies boolean flags", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.orderbook("pool1", {
      levels: 5,
      showCrossed: true,
      showOutliers: false,
    });
    const u = url(spy);
    expect(u).toContain("/api/dex/orderbook/pool1");
    expect(u).toContain("levels=5");
    expect(u).toContain("showCrossed=true");
    expect(u).toContain("showOutliers=false");
  });

  it("orderbookSimulated", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.orderbookSimulated("pool1", { levels: 4 });
    const u = url(spy);
    expect(u).toContain("/api/dex/orderbook/pool1/simulated");
    expect(u).toContain("levels=4");
  });

  it("order", async () => {
    const spy = spyOk({});
    await client.cardano.market.dex.order("txhash", 2);
    expect(url(spy)).toBe(`${BASE}/api/dex/orders/txhash/2`);
  });

  it("order → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.dex.order("txhash", 2)).toBeNull();
  });

  it("ordersByDex with status/page/size", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.ordersByDex("minswap", {
      status: "open",
      page: 2,
      size: 50,
    });
    const u = url(spy);
    expect(u).toContain("/api/dex/orders/dex/minswap");
    expect(u).toContain("status=open");
    expect(u).toContain("page=2");
    expect(u).toContain("size=50");
  });

  it("ordersByOwner", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.ordersByOwner("pkh1", { size: 20 });
    const u = url(spy);
    expect(u).toContain("/api/dex/orders/owner/pkh1");
    expect(u).toContain("size=20");
  });

  it("ordersByToken", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.ordersByToken("pol1", "name1", { page: 1 });
    const u = url(spy);
    expect(u).toContain("/api/dex/orders/token/pol1/name1");
    expect(u).toContain("page=1");
  });

  it("quoteBuy passes poolId + amountIn", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.quoteBuy("pool1", 1000);
    const u = url(spy);
    expect(u).toContain("/api/dex/quote/buy");
    expect(u).toContain("poolId=pool1");
    expect(u).toContain("amountIn=1000");
  });

  it("quoteSell passes poolId + amountIn", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.quoteSell("pool1", 2000);
    const u = url(spy);
    expect(u).toContain("/api/dex/quote/sell");
    expect(u).toContain("poolId=pool1");
    expect(u).toContain("amountIn=2000");
  });

  it("swapsRecent", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.swapsRecent({ limit: 5, dex: "sundae", status: "done" });
    const u = url(spy);
    expect(u).toContain("/api/dex/swaps/recent");
    expect(u).toContain("limit=5");
    expect(u).toContain("dex=sundae");
    expect(u).toContain("status=done");
  });

  it("swapsByToken", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.swapsByToken("pol1", "name1", { limit: 7 });
    const u = url(spy);
    expect(u).toContain("/api/dex/swaps/token/pol1/name1");
    expect(u).toContain("limit=7");
  });

  it("topTraders", async () => {
    const spy = spyOk();
    await client.cardano.market.dex.topTraders("pol1", "name1", { limit: 9 });
    const u = url(spy);
    expect(u).toContain("/api/dex/tokens/pol1/name1/top-traders");
    expect(u).toContain("limit=9");
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.nft.* (bindNft)
// ---------------------------------------------------------------------------
describe("cardano.market.nft (bindNft)", () => {
  it("collections", async () => {
    const spy = spyOk();
    await client.cardano.market.nft.collections({ sort: "volume", limit: 20 });
    const u = url(spy);
    expect(u).toContain("/api/nft/collections");
    expect(u).toContain("sort=volume");
    expect(u).toContain("limit=20");
  });

  it("collection", async () => {
    const spy = spyOk({});
    await client.cardano.market.nft.collection("policy1");
    expect(url(spy)).toBe(`${BASE}/api/nft/collection/policy1`);
  });

  it("collection → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.nft.collection("nope")).toBeNull();
  });

  it("floor", async () => {
    const spy = spyOk({});
    await client.cardano.market.nft.floor("policy1");
    expect(url(spy)).toBe(`${BASE}/api/nft/collection/policy1/floor`);
  });

  it("floor → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.nft.floor("nope")).toBeNull();
  });

  it("sales", async () => {
    const spy = spyOk();
    await client.cardano.market.nft.sales("policy1", { limit: 15 });
    const u = url(spy);
    expect(u).toContain("/api/nft/collection/policy1/sales");
    expect(u).toContain("limit=15");
  });

  it("assetPrice", async () => {
    const spy = spyOk({});
    await client.cardano.market.nft.assetPrice("policy1", "name1");
    expect(url(spy)).toBe(`${BASE}/api/nft/asset/policy1/name1/price`);
  });

  it("assetPrice → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.nft.assetPrice("policy1", "name1")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.wallet.* (bindWallet)
// ---------------------------------------------------------------------------
describe("cardano.market.wallet (bindWallet)", () => {
  it("pnl", async () => {
    const spy = spyOk({});
    await client.cardano.market.wallet.pnl("stake1");
    expect(url(spy)).toBe(`${BASE}/api/wallet/stake1/pnl`);
  });

  it("holdings", async () => {
    const spy = spyOk({});
    await client.cardano.market.wallet.holdings("stake1");
    expect(url(spy)).toBe(`${BASE}/api/wallet/stake1/holdings`);
  });

  it("history stringifies adaOnly", async () => {
    const spy = spyOk({});
    await client.cardano.market.wallet.history("stake1", { resolution: "1d", adaOnly: true });
    const u = url(spy);
    expect(u).toContain("/api/wallet/stake1/history");
    expect(u).toContain("resolution=1d");
    expect(u).toContain("adaOnly=true");
  });

  it("multiPnl POSTs the body", async () => {
    const spy = spyOk({});
    const body = { stakeAddresses: ["stake1", "stake2"] };
    await client.cardano.market.wallet.multiPnl(body as never);
    expect(url(spy)).toBe(`${BASE}/api/wallet/pnl`);
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual(body);
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.aggregator.* (bindAggregator)
// ---------------------------------------------------------------------------
describe("cardano.market.aggregator (bindAggregator)", () => {
  it("tokens", async () => {
    const spy = spyOk();
    await client.cardano.market.aggregator.tokens();
    expect(url(spy)).toBe(`${BASE}/api/aggregator/tokens`);
  });

  it("supportedDexes", async () => {
    const spy = spyOk();
    await client.cardano.market.aggregator.supportedDexes();
    expect(url(spy)).toBe(`${BASE}/api/aggregator/supported-dexes`);
  });

  it("status", async () => {
    const spy = spyOk({});
    await client.cardano.market.aggregator.status("txhash");
    expect(url(spy)).toBe(`${BASE}/api/aggregator/status/txhash`);
  });

  it("status → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.aggregator.status("txhash")).toBeNull();
  });

  it("quote POSTs the body", async () => {
    const spy = spyOk({});
    const body = { tokenIn: "ADA", tokenOut: "MIN", amountIn: 1000 };
    await client.cardano.market.aggregator.quote(body as never);
    expect(url(spy)).toBe(`${BASE}/api/aggregator/quote`);
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual(body);
  });

  it("quoteRoutes POSTs the body", async () => {
    const spy = spyOk({});
    const body = { tokenIn: "ADA", tokenOut: "MIN" };
    await client.cardano.market.aggregator.quoteRoutes(body as never);
    expect(url(spy)).toBe(`${BASE}/api/aggregator/quote/routes`);
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual(body);
  });

  it("reverseQuote POSTs the body", async () => {
    const spy = spyOk({});
    const body = { tokenIn: "ADA", tokenOut: "MIN", amountOut: 500 };
    await client.cardano.market.aggregator.reverseQuote(body as never);
    expect(url(spy)).toBe(`${BASE}/api/aggregator/reverse-quote`);
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual(body);
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.leaderboard.* (bindLeaderboard)
// ---------------------------------------------------------------------------
describe("cardano.market.leaderboard (bindLeaderboard)", () => {
  it("list with limit/offset", async () => {
    const spy = spyOk();
    await client.cardano.market.leaderboard.list({ limit: 25, offset: 50 });
    const u = url(spy);
    expect(u).toContain("/api/leaderboard");
    expect(u).toContain("limit=25");
    expect(u).toContain("offset=50");
  });

  it("stats", async () => {
    const spy = spyOk();
    await client.cardano.market.leaderboard.stats();
    expect(url(spy)).toBe(`${BASE}/api/leaderboard/stats`);
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.sync.* (bindSync)
// ---------------------------------------------------------------------------
describe("cardano.market.sync (bindSync)", () => {
  it("status", async () => {
    const spy = spyOk({});
    await client.cardano.market.sync.status();
    expect(url(spy)).toBe(`${BASE}/api/sync/status`);
  });
});

// ---------------------------------------------------------------------------
// client.cardano.market.blueprints.* (bindBlueprints)
// ---------------------------------------------------------------------------
describe("cardano.market.blueprints (bindBlueprints)", () => {
  it("list", async () => {
    const spy = spyOk();
    await client.cardano.market.blueprints.list();
    expect(url(spy)).toBe(`${BASE}/api/blueprints`);
  });

  it("byId", async () => {
    const spy = spyOk({});
    await client.cardano.market.blueprints.byId("bp1");
    expect(url(spy)).toBe(`${BASE}/api/blueprints/bp1`);
  });

  it("byId → null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.cardano.market.blueprints.byId("nope")).toBeNull();
  });

  it("events with opts", async () => {
    const spy = spyOk();
    await client.cardano.market.blueprints.events("bp1", {
      page: 1,
      size: 10,
      phase: "confirmed",
      sinceId: 100,
      fromSlot: 200,
    });
    const u = url(spy);
    expect(u).toContain("/api/blueprints/bp1/events");
    expect(u).toContain("page=1");
    expect(u).toContain("size=10");
    expect(u).toContain("phase=confirmed");
    expect(u).toContain("sinceId=100");
    expect(u).toContain("fromSlot=200");
  });

  it("create POSTs the body", async () => {
    const spy = spyOk({});
    const body = { name: "bp", scriptHash: "hash" };
    await client.cardano.market.blueprints.create(body as never);
    expect(url(spy)).toBe(`${BASE}/api/blueprints`);
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual(body);
  });

  it("remove DELETEs by id", async () => {
    const spy = spyOk({});
    await client.cardano.market.blueprints.remove("bp1");
    expect(url(spy)).toBe(`${BASE}/api/blueprints/bp1`);
    expect(spy.mock.calls[0]![1]!.method).toBe("DELETE");
  });
});

// ---------------------------------------------------------------------------
// Mainnet guard — applies to every market call.
// ---------------------------------------------------------------------------
describe("market data mainnet guard", () => {
  it("non-mainnet client throws NexusUsageError synchronously, no fetch", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const preprod = new NexusClient({
      apiKey: "k",
      network: "CARDANO_PREPROD",
      retryDelaysMs: [],
    });
    expect(() => preprod.cardano.market.prices()).toThrow(NexusUsageError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("non-mainnet guard also fires on sub-namespace calls", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const preprod = new NexusClient({
      apiKey: "k",
      network: "CARDANO_PREVIEW",
      retryDelaysMs: [],
    });
    expect(() => preprod.cardano.market.dex.pools()).toThrow(NexusUsageError);
    expect(() => preprod.cardano.market.blueprints.list()).toThrow(NexusUsageError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("mainnet client proceeds (fetch called once)", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    const mainnet = new NexusClient({
      apiKey: "k",
      network: "CARDANO_MAINNET",
      retryDelaysMs: [],
    });
    await mainnet.cardano.market.prices();
    expect(spy).toHaveBeenCalledOnce();
  });

  it("no-network client proceeds (server decides)", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    const anyNet = new NexusClient({ apiKey: "k", retryDelaysMs: [] });
    await anyNet.cardano.market.prices();
    expect(spy).toHaveBeenCalledOnce();
  });
});
