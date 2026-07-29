import type { NexusClient } from "../../client.js";
import type { GetJson } from "../../http.js";

/** GET /api/btc/chain/tip — chain tip + sync metadata (getblockchaininfo). */
export function getChainTip(client: NexusClient): Promise<GetJson<"/api/btc/chain/tip">> {
  return client.get("/api/btc/chain/tip");
}

/** GET /api/btc/chain/latest-block — the latest fully-applied block. */
export function getLatestBlock(
  client: NexusClient,
): Promise<GetJson<"/api/btc/chain/latest-block">> {
  return client.get("/api/btc/chain/latest-block");
}

/** Namespace fragment: `client.bitcoin.chain.*`. */
export function bindChain(client: NexusClient) {
  return {
    tip: () => getChainTip(client),
    latestBlock: () => getLatestBlock(client),
  } as const;
}
