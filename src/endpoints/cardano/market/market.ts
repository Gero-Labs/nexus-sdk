import type { NexusClient } from "../../../client.js";
import { NexusApiError } from "../../../errors.js";
import type { GetJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

const enc = encodeURIComponent;

/** GET /api/market/tokens — tracked asset identifiers. */
export function getMarketTokens(
  client: NexusClient,
): Promise<GetJson<"/api/market/tokens">> {
  assertMarketMainnet(client);
  return client.get("/api/market/tokens");
}

/** GET /api/market/tokens/{assetId}/metadata — token metadata; null when not found. */
export async function getMarketTokenMetadata(
  client: NexusClient,
  assetId: string,
): Promise<GetJson<"/api/market/tokens/{assetId}/metadata"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/market/tokens/${enc(assetId)}/metadata`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/market/prices — latest prices for all tracked tokens. */
export function getMarketPrices(
  client: NexusClient,
): Promise<GetJson<"/api/market/prices">> {
  assertMarketMainnet(client);
  return client.get("/api/market/prices");
}

/** GET /api/market/prices/{assetId} — latest price for a token; null when not found. */
export async function getMarketPrice(
  client: NexusClient,
  assetId: string,
): Promise<GetJson<"/api/market/prices/{assetId}"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/market/prices/${enc(assetId)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/market/prices/{assetId}/all — price from every source for a token. */
export function getMarketPriceAllSources(
  client: NexusClient,
  assetId: string,
): Promise<GetJson<"/api/market/prices/{assetId}/all">> {
  assertMarketMainnet(client);
  return client.get(`/api/market/prices/${enc(assetId)}/all`);
}

/** GET /api/market/prices/top-volume — tokens ranked by trading volume. */
export function getMarketTopVolume(
  client: NexusClient,
  opts?: { limit?: number },
): Promise<GetJson<"/api/market/prices/top-volume">> {
  assertMarketMainnet(client);
  return client.get("/api/market/prices/top-volume", { limit: opts?.limit });
}

/** GET /api/market/prices/top-tvl — tokens ranked by total value locked. */
export function getMarketTopTvl(
  client: NexusClient,
  opts?: { limit?: number },
): Promise<GetJson<"/api/market/prices/top-tvl">> {
  assertMarketMainnet(client);
  return client.get("/api/market/prices/top-tvl", { limit: opts?.limit });
}

/** GET /api/market/history/{assetId} — price history for a token over a time range. */
export function getMarketHistory(
  client: NexusClient,
  assetId: string,
  from: string,
  to: string,
): Promise<GetJson<"/api/market/history/{assetId}">> {
  assertMarketMainnet(client);
  return client.get(`/api/market/history/${enc(assetId)}`, { from, to });
}

/** GET /api/market/history/{assetId}/at — price at a point in time; null when not found. */
export async function getMarketHistoryAt(
  client: NexusClient,
  assetId: string,
  time: string,
): Promise<GetJson<"/api/market/history/{assetId}/at"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/market/history/${enc(assetId)}/at`, { time });
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/market/ada — current ADA price. */
export function getMarketAda(client: NexusClient): Promise<GetJson<"/api/market/ada">> {
  assertMarketMainnet(client);
  return client.get("/api/market/ada");
}

/** Namespace fragment: `client.cardano.market.*`. */
export function bindMarket(client: NexusClient) {
  return {
    tokens: () => getMarketTokens(client),
    tokenMetadata: (assetId: string) => getMarketTokenMetadata(client, assetId),
    prices: () => getMarketPrices(client),
    price: (assetId: string) => getMarketPrice(client, assetId),
    priceAllSources: (assetId: string) => getMarketPriceAllSources(client, assetId),
    topVolume: (opts?: { limit?: number }) => getMarketTopVolume(client, opts),
    topTvl: (opts?: { limit?: number }) => getMarketTopTvl(client, opts),
    history: (assetId: string, from: string, to: string) =>
      getMarketHistory(client, assetId, from, to),
    historyAt: (assetId: string, time: string) => getMarketHistoryAt(client, assetId, time),
    ada: () => getMarketAda(client),
  } as const;
}
