import type { NexusClient } from "../client.js";
import type { NexusDatum, NexusScriptDetail } from "../types.js";

export function getDatum(client: NexusClient, datumHash: string): Promise<NexusDatum> {
  return client.get(`/api/scripts/datum/${encodeURIComponent(datumHash)}`);
}

export function getScript(client: NexusClient, scriptHash: string): Promise<NexusScriptDetail> {
  return client.get(`/api/scripts/${encodeURIComponent(scriptHash)}`);
}
