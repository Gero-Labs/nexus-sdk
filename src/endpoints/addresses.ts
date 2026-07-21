import type { NexusClient } from "../client.js";
import type { NexusAddressUtxo } from "../types.js";

export function getAddressUtxos(
  client: NexusClient,
  address: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(`/api/addresses/${encodeURIComponent(address)}/utxos`, { page, pageSize });
}

export function getCredentialUtxos(
  client: NexusClient,
  credentialHash: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(`/api/addresses/cred/${encodeURIComponent(credentialHash)}/utxos`, {
    page,
    pageSize,
  });
}

export function getAddressUtxosWithAsset(
  client: NexusClient,
  address: string,
  unit: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(
    `/api/addresses/${encodeURIComponent(address)}/utxos/${encodeURIComponent(unit)}`,
    { page, pageSize },
  );
}
