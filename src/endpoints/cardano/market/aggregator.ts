import type { NexusClient } from "../../../client.js";
import { NexusApiError } from "../../../errors.js";
import { type GetJson, type PostBody, type PostJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

const enc = encodeURIComponent;

/** GET /api/aggregator/tokens — tokens routable through the swap aggregator. */
export function getAggregatorTokens(
  client: NexusClient,
): Promise<GetJson<"/api/aggregator/tokens">> {
  assertMarketMainnet(client);
  return client.get("/api/aggregator/tokens");
}

/** GET /api/aggregator/supported-dexes — DEXes the aggregator can route across. */
export function getSupportedDexes(
  client: NexusClient,
): Promise<GetJson<"/api/aggregator/supported-dexes">> {
  assertMarketMainnet(client);
  return client.get("/api/aggregator/supported-dexes");
}

/** GET /api/aggregator/status/{txHash} — aggregator order status; null when not found. */
export async function getAggregatorStatus(
  client: NexusClient,
  txHash: string,
): Promise<GetJson<"/api/aggregator/status/{txHash}"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/aggregator/status/${enc(txHash)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** POST /api/aggregator/quote — best-route swap quote for an exact input amount. */
export function getAggregatorQuote(
  client: NexusClient,
  body: PostBody<"/api/aggregator/quote">,
): Promise<PostJson<"/api/aggregator/quote">> {
  assertMarketMainnet(client);
  return client.post("/api/aggregator/quote", body);
}

/** POST /api/aggregator/quote/routes — candidate routes for a swap quote. */
export function getAggregatorQuoteRoutes(
  client: NexusClient,
  body: PostBody<"/api/aggregator/quote/routes">,
): Promise<PostJson<"/api/aggregator/quote/routes">> {
  assertMarketMainnet(client);
  return client.post("/api/aggregator/quote/routes", body);
}

/** POST /api/aggregator/reverse-quote — exact-out quote (least input for a desired output). */
export function getAggregatorReverseQuote(
  client: NexusClient,
  body: PostBody<"/api/aggregator/reverse-quote">,
): Promise<PostJson<"/api/aggregator/reverse-quote">> {
  assertMarketMainnet(client);
  return client.post("/api/aggregator/reverse-quote", body);
}

/** Namespace fragment: `client.cardano.aggregator.*`. */
export function bindAggregator(client: NexusClient) {
  return {
    tokens: () => getAggregatorTokens(client),
    supportedDexes: () => getSupportedDexes(client),
    status: (txHash: string) => getAggregatorStatus(client, txHash),
    quote: (body: PostBody<"/api/aggregator/quote">) => getAggregatorQuote(client, body),
    quoteRoutes: (body: PostBody<"/api/aggregator/quote/routes">) =>
      getAggregatorQuoteRoutes(client, body),
    reverseQuote: (body: PostBody<"/api/aggregator/reverse-quote">) =>
      getAggregatorReverseQuote(client, body),
  } as const;
}
