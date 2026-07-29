import type { NexusClient } from "../../client.js";
import type { GetJson } from "../../http.js";

/** GET /api/btc/mempool — current mempool snapshot (count, vsize, fee histogram). */
export function getMempool(client: NexusClient): Promise<GetJson<"/api/btc/mempool">> {
  return client.get("/api/btc/mempool");
}

/** Namespace fragment: `client.bitcoin.mempool.*`. */
export function bindMempool(client: NexusClient) {
  return {
    snapshot: () => getMempool(client),
  } as const;
}
