import type { NexusClient } from "../../client.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/account/{stakeAddress}/info — stake account summary. */
export function getAccountInfo(
  client: NexusClient,
  stakeAddress: string,
): Promise<GetJson<"/api/account/{stakeAddress}/info">> {
  return client.get(`/api/account/${enc(stakeAddress)}/info`);
}

/** GET /api/account/{stakeAddress}/addresses — addresses controlled by a stake account. */
export function getAccountAddresses(
  client: NexusClient,
  stakeAddress: string,
): Promise<GetJson<"/api/account/{stakeAddress}/addresses">> {
  return client.get(`/api/account/${enc(stakeAddress)}/addresses`);
}

/** GET /api/account/{stakeAddress}/assets — assets held across a stake account's addresses. */
export function getAccountAssets(
  client: NexusClient,
  stakeAddress: string,
  opts?: { policy?: string } & PageOptions,
): Promise<GetJson<"/api/account/{stakeAddress}/assets">> {
  return client.get(`/api/account/${enc(stakeAddress)}/assets`, {
    ...pageQuery(opts),
    policy: opts?.policy,
  });
}

/** GET /api/account/{stakeAddress}/rewards — reward history for a stake account. */
export function getAccountRewards(
  client: NexusClient,
  stakeAddress: string,
): Promise<GetJson<"/api/account/{stakeAddress}/rewards">> {
  return client.get(`/api/account/${enc(stakeAddress)}/rewards`);
}

/** GET /api/account/{stakeAddress}/txs — transactions for a stake account since `from`. */
export function getAccountTxs(
  client: NexusClient,
  stakeAddress: string,
  from: string,
): Promise<GetJson<"/api/account/{stakeAddress}/txs">> {
  return client.get(`/api/account/${enc(stakeAddress)}/txs`, { from });
}

/** GET /api/account/{stakeAddress}/utxos — UTxOs across a stake account's addresses. */
export function getAccountUtxos(
  client: NexusClient,
  stakeAddress: string,
): Promise<GetJson<"/api/account/{stakeAddress}/utxos">> {
  return client.get(`/api/account/${enc(stakeAddress)}/utxos`);
}

/** Namespace fragment: `client.cardano.accounts.*`. */
export function bindAccounts(client: NexusClient) {
  return {
    info: (stakeAddress: string) => getAccountInfo(client, stakeAddress),
    addresses: (stakeAddress: string) => getAccountAddresses(client, stakeAddress),
    assets: (stakeAddress: string, opts?: { policy?: string } & PageOptions) =>
      getAccountAssets(client, stakeAddress, opts),
    rewards: (stakeAddress: string) => getAccountRewards(client, stakeAddress),
    txs: (stakeAddress: string, from: string) => getAccountTxs(client, stakeAddress, from),
    utxos: (stakeAddress: string) => getAccountUtxos(client, stakeAddress),
  } as const;
}
