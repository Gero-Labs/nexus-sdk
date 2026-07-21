import type { NexusClient } from "../client.js";
import type { NexusAccountInfo } from "../types.js";

export function getAccountInfo(
  client: NexusClient,
  stakeAddress: string,
): Promise<NexusAccountInfo> {
  return client.get(`/api/account/${encodeURIComponent(stakeAddress)}/info`);
}
