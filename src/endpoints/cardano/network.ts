import type { NexusClient } from "../../client.js";
import type { GetJson } from "../../http.js";

/** GET /api/network/info — network protocol + supply information. */
export function getNetworkInfo(client: NexusClient): Promise<GetJson<"/api/network/info">> {
  return client.get("/api/network/info");
}

/** Namespace fragment: `client.cardano.network.*`. */
export function bindNetwork(client: NexusClient) {
  return {
    info: () => getNetworkInfo(client),
  } as const;
}
