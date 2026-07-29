import type { NexusClient } from "../../../client.js";
import { NexusApiError } from "../../../errors.js";
import type { GetJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

const enc = encodeURIComponent;

/** Status + pagination options shared by the DEX order-history listings. */
export interface OrderListOptions {
  status?: string;
  page?: number;
  size?: number;
}

/** GET /api/dex/pools — all liquidity pools. */
export function getPools(client: NexusClient): Promise<GetJson<"/api/dex/pools">> {
  assertMarketMainnet(client);
  return client.get("/api/dex/pools");
}

/** GET /api/dex/pools/{poolId} — a liquidity pool by id; null when not found. */
export async function getPool(
  client: NexusClient,
  poolId: string,
): Promise<GetJson<"/api/dex/pools/{poolId}"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/dex/pools/${enc(poolId)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/dex/pools/dex/{dex} — pools for a specific DEX. */
export function getPoolsByDex(
  client: NexusClient,
  dex: string,
): Promise<GetJson<"/api/dex/pools/dex/{dex}">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/pools/dex/${enc(dex)}`);
}

/** GET /api/dex/pools/token/{policyId}/{assetName} — pools containing a token. */
export function getPoolsByToken(
  client: NexusClient,
  policyId: string,
  assetName: string,
): Promise<GetJson<"/api/dex/pools/token/{policyId}/{assetName}">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/pools/token/${enc(policyId)}/${enc(assetName)}`);
}

/** GET /api/dex/pools/pair — pools trading a specific token pair. */
export function getPoolsPair(
  client: NexusClient,
  tokenAPolicyId: string,
  tokenAAssetName: string,
  tokenBPolicyId: string,
  tokenBAssetName: string,
): Promise<GetJson<"/api/dex/pools/pair">> {
  assertMarketMainnet(client);
  return client.get("/api/dex/pools/pair", {
    tokenAPolicyId,
    tokenAAssetName,
    tokenBPolicyId,
    tokenBAssetName,
  });
}

/** GET /api/dex/pools/top-tvl — pools ranked by total value locked. */
export function getPoolsTopTvl(
  client: NexusClient,
  opts?: { limit?: number },
): Promise<GetJson<"/api/dex/pools/top-tvl">> {
  assertMarketMainnet(client);
  return client.get("/api/dex/pools/top-tvl", { limit: opts?.limit });
}

/** GET /api/dex/orderbook/{poolId} — aggregated order book for a pool. */
export function getOrderbook(
  client: NexusClient,
  poolId: string,
  opts?: { levels?: number; showCrossed?: boolean; showOutliers?: boolean },
): Promise<GetJson<"/api/dex/orderbook/{poolId}">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/orderbook/${enc(poolId)}`, {
    levels: opts?.levels,
    showCrossed: opts?.showCrossed === undefined ? undefined : String(opts.showCrossed),
    showOutliers: opts?.showOutliers === undefined ? undefined : String(opts.showOutliers),
  });
}

/** GET /api/dex/orderbook/{poolId}/simulated — simulated order book for a pool. */
export function getOrderbookSimulated(
  client: NexusClient,
  poolId: string,
  opts?: { levels?: number },
): Promise<GetJson<"/api/dex/orderbook/{poolId}/simulated">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/orderbook/${enc(poolId)}/simulated`, { levels: opts?.levels });
}

/** GET /api/dex/orders/{txHash}/{outputIndex} — a DEX order by output ref; null when not found. */
export async function getOrder(
  client: NexusClient,
  txHash: string,
  outputIndex: number,
): Promise<GetJson<"/api/dex/orders/{txHash}/{outputIndex}"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/dex/orders/${enc(txHash)}/${outputIndex}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/dex/orders/dex/{dex} — order history for a DEX. */
export function getOrdersByDex(
  client: NexusClient,
  dex: string,
  opts?: OrderListOptions,
): Promise<GetJson<"/api/dex/orders/dex/{dex}">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/orders/dex/${enc(dex)}`, {
    status: opts?.status,
    page: opts?.page,
    size: opts?.size,
  });
}

/** GET /api/dex/orders/owner/{pkh} — order history for an owner payment key hash. */
export function getOrdersByOwner(
  client: NexusClient,
  pkh: string,
  opts?: OrderListOptions,
): Promise<GetJson<"/api/dex/orders/owner/{pkh}">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/orders/owner/${enc(pkh)}`, {
    status: opts?.status,
    page: opts?.page,
    size: opts?.size,
  });
}

/** GET /api/dex/orders/token/{policyId}/{assetName} — order history for a token. */
export function getOrdersByToken(
  client: NexusClient,
  policyId: string,
  assetName: string,
  opts?: OrderListOptions,
): Promise<GetJson<"/api/dex/orders/token/{policyId}/{assetName}">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/orders/token/${enc(policyId)}/${enc(assetName)}`, {
    status: opts?.status,
    page: opts?.page,
    size: opts?.size,
  });
}

/** GET /api/dex/quote/buy — quote for buying from a pool. */
export function getQuoteBuy(
  client: NexusClient,
  poolId: string,
  amountIn: number,
): Promise<GetJson<"/api/dex/quote/buy">> {
  assertMarketMainnet(client);
  return client.get("/api/dex/quote/buy", { poolId, amountIn });
}

/** GET /api/dex/quote/sell — quote for selling into a pool. */
export function getQuoteSell(
  client: NexusClient,
  poolId: string,
  amountIn: number,
): Promise<GetJson<"/api/dex/quote/sell">> {
  assertMarketMainnet(client);
  return client.get("/api/dex/quote/sell", { poolId, amountIn });
}

/** GET /api/dex/swaps/recent — recent swaps across DEXes. */
export function getSwapsRecent(
  client: NexusClient,
  opts?: { limit?: number; dex?: string; status?: string },
): Promise<GetJson<"/api/dex/swaps/recent">> {
  assertMarketMainnet(client);
  return client.get("/api/dex/swaps/recent", {
    limit: opts?.limit,
    dex: opts?.dex,
    status: opts?.status,
  });
}

/** GET /api/dex/swaps/token/{policyId}/{assetName} — recent swaps for a token. */
export function getSwapsByToken(
  client: NexusClient,
  policyId: string,
  assetName: string,
  opts?: { limit?: number },
): Promise<GetJson<"/api/dex/swaps/token/{policyId}/{assetName}">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/swaps/token/${enc(policyId)}/${enc(assetName)}`, {
    limit: opts?.limit,
  });
}

/** GET /api/dex/tokens/{policyId}/{assetName}/top-traders — top traders of a token. */
export function getTopTraders(
  client: NexusClient,
  policyId: string,
  assetName: string,
  opts?: { limit?: number },
): Promise<GetJson<"/api/dex/tokens/{policyId}/{assetName}/top-traders">> {
  assertMarketMainnet(client);
  return client.get(`/api/dex/tokens/${enc(policyId)}/${enc(assetName)}/top-traders`, {
    limit: opts?.limit,
  });
}

/** Namespace fragment: `client.cardano.dex.*`. */
export function bindDex(client: NexusClient) {
  return {
    pools: () => getPools(client),
    pool: (poolId: string) => getPool(client, poolId),
    poolsByDex: (dex: string) => getPoolsByDex(client, dex),
    poolsByToken: (policyId: string, assetName: string) =>
      getPoolsByToken(client, policyId, assetName),
    poolsPair: (
      tokenAPolicyId: string,
      tokenAAssetName: string,
      tokenBPolicyId: string,
      tokenBAssetName: string,
    ) => getPoolsPair(client, tokenAPolicyId, tokenAAssetName, tokenBPolicyId, tokenBAssetName),
    poolsTopTvl: (opts?: { limit?: number }) => getPoolsTopTvl(client, opts),
    orderbook: (
      poolId: string,
      opts?: { levels?: number; showCrossed?: boolean; showOutliers?: boolean },
    ) => getOrderbook(client, poolId, opts),
    orderbookSimulated: (poolId: string, opts?: { levels?: number }) =>
      getOrderbookSimulated(client, poolId, opts),
    order: (txHash: string, outputIndex: number) => getOrder(client, txHash, outputIndex),
    ordersByDex: (dex: string, opts?: OrderListOptions) => getOrdersByDex(client, dex, opts),
    ordersByOwner: (pkh: string, opts?: OrderListOptions) =>
      getOrdersByOwner(client, pkh, opts),
    ordersByToken: (policyId: string, assetName: string, opts?: OrderListOptions) =>
      getOrdersByToken(client, policyId, assetName, opts),
    quoteBuy: (poolId: string, amountIn: number) => getQuoteBuy(client, poolId, amountIn),
    quoteSell: (poolId: string, amountIn: number) => getQuoteSell(client, poolId, amountIn),
    swapsRecent: (opts?: { limit?: number; dex?: string; status?: string }) =>
      getSwapsRecent(client, opts),
    swapsByToken: (policyId: string, assetName: string, opts?: { limit?: number }) =>
      getSwapsByToken(client, policyId, assetName, opts),
    topTraders: (policyId: string, assetName: string, opts?: { limit?: number }) =>
      getTopTraders(client, policyId, assetName, opts),
  } as const;
}
