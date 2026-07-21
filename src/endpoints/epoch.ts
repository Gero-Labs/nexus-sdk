import type { NexusClient } from "../client.js";
import type { NexusProtocolParams } from "../types.js";

export function getProtocolParams(client: NexusClient): Promise<NexusProtocolParams> {
  // /api/epoch/params requires an epoch argument; latest/parameters returns the
  // current epoch's params (wire-verified shape, canonical PlutusV1/V2/V3 keys).
  return client.get("/api/epoch/latest/parameters");
}
