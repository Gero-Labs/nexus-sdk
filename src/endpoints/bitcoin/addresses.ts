import type { NexusClient } from "../../client.js";
import type { GetJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/btc/addresses/{address} — address statistics (chain + mempool). */
export function getAddress(
  client: NexusClient,
  address: string,
): Promise<GetJson<"/api/btc/addresses/{address}">> {
  return client.get(`/api/btc/addresses/${enc(address)}`);
}

/** GET /api/btc/addresses/{address}/balance — confirmed satoshi balance for an address. */
export function getAddressBalance(
  client: NexusClient,
  address: string,
): Promise<GetJson<"/api/btc/addresses/{address}/balance">> {
  return client.get(`/api/btc/addresses/${enc(address)}/balance`);
}

/** GET /api/btc/addresses/{address}/utxos — unspent outputs for an address. */
export function getAddressUtxos(
  client: NexusClient,
  address: string,
): Promise<GetJson<"/api/btc/addresses/{address}/utxos">> {
  return client.get(`/api/btc/addresses/${enc(address)}/utxos`);
}

/** GET /api/btc/addresses/{address}/ordinals — inscription IDs + rune balances held at an address. */
export function getAddressOrdinals(
  client: NexusClient,
  address: string,
): Promise<GetJson<"/api/btc/addresses/{address}/ordinals">> {
  return client.get(`/api/btc/addresses/${enc(address)}/ordinals`);
}

/** Namespace fragment: `client.bitcoin.addresses.*`. */
export function bindAddresses(client: NexusClient) {
  return {
    get: (address: string) => getAddress(client, address),
    balance: (address: string) => getAddressBalance(client, address),
    utxos: (address: string) => getAddressUtxos(client, address),
    ordinals: (address: string) => getAddressOrdinals(client, address),
  } as const;
}
