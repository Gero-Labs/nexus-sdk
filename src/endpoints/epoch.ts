import type { NexusClient } from "../client.js";
import type { NexusProtocolParams } from "../types.js";

export function getProtocolParams(client: NexusClient): Promise<NexusProtocolParams> {
  return client.get("/api/epoch/params");
}
