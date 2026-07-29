import type { NexusClient } from "../../client.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/policy/{policyId}/assets — assets minted under a policy. */
export function getPolicyAssets(
  client: NexusClient,
  policyId: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/policy/{policyId}/assets">> {
  return client.get(`/api/policy/${enc(policyId)}/assets`, pageQuery(opts));
}

/** GET /api/policy/{policyId}/utxos — UTxOs holding assets under a policy. */
export function getPolicyUtxos(
  client: NexusClient,
  policyId: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/policy/{policyId}/utxos">> {
  return client.get(`/api/policy/${enc(policyId)}/utxos`, pageQuery(opts));
}

/** Namespace fragment: `client.cardano.policy.*`. */
export function bindPolicy(client: NexusClient) {
  return {
    assets: (policyId: string, opts?: PageOptions) => getPolicyAssets(client, policyId, opts),
    utxos: (policyId: string, opts?: PageOptions) => getPolicyUtxos(client, policyId, opts),
  } as const;
}
