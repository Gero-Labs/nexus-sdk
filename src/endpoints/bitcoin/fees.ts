import type { NexusClient } from "../../client.js";
import type { GetJson } from "../../http.js";

/** GET /api/btc/fees — fee-rate estimates (sat/vB) keyed by target block count. */
export function getFeeEstimates(client: NexusClient): Promise<GetJson<"/api/btc/fees">> {
  return client.get("/api/btc/fees");
}

/** Namespace fragment: `client.bitcoin.fees.*`. */
export function bindFees(client: NexusClient) {
  return {
    estimates: () => getFeeEstimates(client),
  } as const;
}
