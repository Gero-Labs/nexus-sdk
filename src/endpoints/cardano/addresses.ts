import type { NexusClient } from "../../client.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/addresses/{address} — summary for an address. */
export function getAddress(
  client: NexusClient,
  address: string,
): Promise<GetJson<"/api/addresses/{address}">> {
  return client.get(`/api/addresses/${enc(address)}`);
}

/** GET /api/addresses/{address}/utxos — UTxOs at an address. */
export function getAddressUtxos(
  client: NexusClient,
  address: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/addresses/{address}/utxos">> {
  return client.get(`/api/addresses/${enc(address)}/utxos`, pageQuery(opts));
}

/** GET /api/addresses/{address}/utxos/{asset} — UTxOs at an address holding a specific unit. */
export function getAddressUtxosWithAsset(
  client: NexusClient,
  address: string,
  unit: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/addresses/{address}/utxos/{asset}">> {
  return client.get(`/api/addresses/${enc(address)}/utxos/${enc(unit)}`, pageQuery(opts));
}

/** GET /api/addresses/cred/{credential}/utxos — UTxOs by payment credential. */
export function getCredentialUtxos(
  client: NexusClient,
  credential: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/addresses/cred/{credential}/utxos">> {
  return client.get(`/api/addresses/cred/${enc(credential)}/utxos`, pageQuery(opts));
}

/** GET /api/addresses/cred/{credential}/transactions — transactions by payment credential. */
export function getCredentialTransactions(
  client: NexusClient,
  credential: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/addresses/cred/{credential}/transactions">> {
  return client.get(`/api/addresses/cred/${enc(credential)}/transactions`, pageQuery(opts));
}

/** GET /api/addresses/transactions/{address} — transactions involving an address. */
export function getAddressTransactions(
  client: NexusClient,
  address: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/addresses/transactions/{address}">> {
  return client.get(`/api/addresses/transactions/${enc(address)}`, pageQuery(opts));
}

/** GET /api/addresses/{address}/transactions/history — full transaction history for an address. */
export function getAddressTransactionHistory(
  client: NexusClient,
  address: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/addresses/{address}/transactions/history">> {
  return client.get(`/api/addresses/${enc(address)}/transactions/history`, pageQuery(opts));
}

/** GET /api/addresses/{address}/transactions/by-slot — transactions for an address within a slot range. */
export function getAddressTransactionsBySlot(
  client: NexusClient,
  address: string,
  query?: { fromSlot?: number; toSlot?: number } & PageOptions,
): Promise<GetJson<"/api/addresses/{address}/transactions/by-slot">> {
  return client.get(`/api/addresses/${enc(address)}/transactions/by-slot`, {
    ...pageQuery(query),
    fromSlot: query?.fromSlot,
    toSlot: query?.toSlot,
  });
}

/** Namespace fragment: `client.cardano.addresses.*`. */
export function bindAddresses(client: NexusClient) {
  return {
    get: (address: string) => getAddress(client, address),
    utxos: (address: string, opts?: PageOptions) => getAddressUtxos(client, address, opts),
    utxosWithAsset: (address: string, unit: string, opts?: PageOptions) =>
      getAddressUtxosWithAsset(client, address, unit, opts),
    credentialUtxos: (credential: string, opts?: PageOptions) =>
      getCredentialUtxos(client, credential, opts),
    credentialTransactions: (credential: string, opts?: PageOptions) =>
      getCredentialTransactions(client, credential, opts),
    transactions: (address: string, opts?: PageOptions) =>
      getAddressTransactions(client, address, opts),
    transactionHistory: (address: string, opts?: PageOptions) =>
      getAddressTransactionHistory(client, address, opts),
    transactionsBySlot: (
      address: string,
      query?: { fromSlot?: number; toSlot?: number } & PageOptions,
    ) => getAddressTransactionsBySlot(client, address, query),
  } as const;
}
