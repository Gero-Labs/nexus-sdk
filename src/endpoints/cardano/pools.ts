import type { NexusClient } from "../../client.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";
import { NexusApiError } from "../../errors.js";

const enc = encodeURIComponent;

/** GET /api/pools — list stake pools. */
export function getPools(client: NexusClient): Promise<GetJson<"/api/pools">> {
  return client.get("/api/pools");
}

/** GET /api/pools/{id} — single stake pool by id; null when not found. */
export async function getPool(
  client: NexusClient,
  id: string,
): Promise<GetJson<"/api/pools/{id}"> | null> {
  try {
    return await client.get(`/api/pools/${enc(id)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/pools/{poolId}/history — reward/stake history for a pool. */
export function getPoolHistory(
  client: NexusClient,
  poolId: string,
): Promise<GetJson<"/api/pools/{poolId}/history">> {
  return client.get(`/api/pools/${enc(poolId)}/history`);
}

/** GET /api/pools/{poolId}/epochs/{epoch} — pool detail for a specific epoch. */
export function getPoolEpoch(
  client: NexusClient,
  poolId: string,
  epoch: number,
): Promise<GetJson<"/api/pools/{poolId}/epochs/{epoch}">> {
  return client.get(`/api/pools/${enc(poolId)}/epochs/${enc(String(epoch))}`);
}

/** GET /api/pools/registrations — recent pool registrations. */
export function getPoolRegistrations(
  client: NexusClient,
  opts?: PageOptions,
): Promise<GetJson<"/api/pools/registrations">> {
  return client.get("/api/pools/registrations", pageQuery(opts));
}

/** GET /api/pools/registrations/{epoch} — pool registrations in a specific epoch. */
export function getPoolRegistrationsByEpoch(
  client: NexusClient,
  epoch: number,
  opts?: PageOptions,
): Promise<GetJson<"/api/pools/registrations/{epoch}">> {
  return client.get(`/api/pools/registrations/${enc(String(epoch))}`, pageQuery(opts));
}

/** GET /api/pools/retirements — recent pool retirements. */
export function getPoolRetirements(
  client: NexusClient,
  opts?: PageOptions,
): Promise<GetJson<"/api/pools/retirements">> {
  return client.get("/api/pools/retirements", pageQuery(opts));
}

/** GET /api/pools/retiring/{epoch} — pools retiring in a specific epoch. */
export function getPoolsRetiring(
  client: NexusClient,
  epoch: number,
): Promise<GetJson<"/api/pools/retiring/{epoch}">> {
  return client.get(`/api/pools/retiring/${enc(String(epoch))}`);
}

/** Namespace fragment: `client.cardano.pools.*`. */
export function bindPools(client: NexusClient) {
  return {
    list: () => getPools(client),
    byId: (id: string) => getPool(client, id),
    history: (poolId: string) => getPoolHistory(client, poolId),
    epoch: (poolId: string, epoch: number) => getPoolEpoch(client, poolId, epoch),
    registrations: (opts?: PageOptions) => getPoolRegistrations(client, opts),
    registrationsByEpoch: (epoch: number, opts?: PageOptions) =>
      getPoolRegistrationsByEpoch(client, epoch, opts),
    retirements: (opts?: PageOptions) => getPoolRetirements(client, opts),
    retiring: (epoch: number) => getPoolsRetiring(client, epoch),
  } as const;
}
