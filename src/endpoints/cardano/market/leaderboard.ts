import type { NexusClient } from "../../../client.js";
import type { GetJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

/** GET /api/leaderboard — trader leaderboard. */
export function getLeaderboard(
  client: NexusClient,
  opts?: { limit?: number; offset?: number },
): Promise<GetJson<"/api/leaderboard">> {
  assertMarketMainnet(client);
  return client.get("/api/leaderboard", { limit: opts?.limit, offset: opts?.offset });
}

/** GET /api/leaderboard/stats — aggregate leaderboard statistics. */
export function getLeaderboardStats(
  client: NexusClient,
): Promise<GetJson<"/api/leaderboard/stats">> {
  assertMarketMainnet(client);
  return client.get("/api/leaderboard/stats");
}

/** Namespace fragment: `client.cardano.leaderboard.*`. */
export function bindLeaderboard(client: NexusClient) {
  return {
    list: (opts?: { limit?: number; offset?: number }) => getLeaderboard(client, opts),
    stats: () => getLeaderboardStats(client),
  } as const;
}
