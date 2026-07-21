import type { NexusClient } from "../client.js";
import type { NexusAddressUtxo } from "../types.js";

export function getAssetUtxos(
  client: NexusClient,
  unit: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(`/api/assets/${encodeURIComponent(unit)}/utxos`, { page, pageSize });
}
