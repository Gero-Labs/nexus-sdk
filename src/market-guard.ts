import type { NexusClient } from "./client.js";
import { NexusUsageError } from "./errors.js";

/**
 * Cardano market data is served from mainnet only. If the client was constructed with an
 * explicit non-mainnet network, fail fast before any request. When no network was set, the
 * SDK cannot know the API key's scoped network, so the request proceeds and a wrong-network
 * or wrong-tier key is rejected server-side as a normal NexusApiError.
 */
export function assertMarketMainnet(client: NexusClient): void {
  const network = client.networkOption;
  if (network && network !== "CARDANO_MAINNET") {
    throw new NexusUsageError(
      `Market data is Cardano mainnet only; client network is ${network}`,
    );
  }
}
