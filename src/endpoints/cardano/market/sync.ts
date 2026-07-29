import type { NexusClient } from "../../../client.js";
import type { GetJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

/** GET /api/sync/status — market-data indexer sync status. */
export function getSyncStatus(client: NexusClient): Promise<GetJson<"/api/sync/status">> {
  assertMarketMainnet(client);
  return client.get("/api/sync/status");
}

/** Namespace fragment: `client.cardano.sync.*`. */
export function bindSync(client: NexusClient) {
  return {
    status: () => getSyncStatus(client),
  } as const;
}
