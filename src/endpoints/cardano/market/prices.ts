import type { NexusClient } from "../../../client.js";
import type { GetJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

/** GET /api/prices/latest — latest prices for the given symbols (all when omitted). */
export function getLatestPrices(
  client: NexusClient,
  opts?: { symbols?: string[] },
): Promise<GetJson<"/api/prices/latest">> {
  assertMarketMainnet(client);
  return client.get("/api/prices/latest", { symbols: opts?.symbols?.join(",") });
}

/** GET /api/prices/rsi — relative-strength-index entries at a resolution. */
export function getRsi(
  client: NexusClient,
  opts?: { resolution?: string },
): Promise<GetJson<"/api/prices/rsi">> {
  assertMarketMainnet(client);
  return client.get("/api/prices/rsi", { resolution: opts?.resolution });
}

/** GET /api/prices/ada/candles — ADA OHLC candles. */
export function getAdaCandles(
  client: NexusClient,
  opts?: { currency?: string; resolution?: string; from?: number; to?: number },
): Promise<GetJson<"/api/prices/ada/candles">> {
  assertMarketMainnet(client);
  return client.get("/api/prices/ada/candles", {
    currency: opts?.currency,
    resolution: opts?.resolution,
    from: opts?.from,
    to: opts?.to,
  });
}

/** GET /api/prices/historical/candles — OHLC candles for a token pair. */
export function getHistoricalCandles(
  client: NexusClient,
  assetId: string,
  opts?: {
    quoteAssetId?: string;
    resolution?: string;
    from?: number;
    to?: number;
    currency?: string;
  },
): Promise<GetJson<"/api/prices/historical/candles">> {
  assertMarketMainnet(client);
  return client.get("/api/prices/historical/candles", {
    assetId,
    quoteAssetId: opts?.quoteAssetId,
    resolution: opts?.resolution,
    from: opts?.from,
    to: opts?.to,
    currency: opts?.currency,
  });
}

/** Namespace fragment: `client.cardano.prices.*`. */
export function bindPrices(client: NexusClient) {
  return {
    latest: (opts?: { symbols?: string[] }) => getLatestPrices(client, opts),
    rsi: (opts?: { resolution?: string }) => getRsi(client, opts),
    adaCandles: (opts?: {
      currency?: string;
      resolution?: string;
      from?: number;
      to?: number;
    }) => getAdaCandles(client, opts),
    historicalCandles: (
      assetId: string,
      opts?: {
        quoteAssetId?: string;
        resolution?: string;
        from?: number;
        to?: number;
        currency?: string;
      },
    ) => getHistoricalCandles(client, assetId, opts),
  } as const;
}
