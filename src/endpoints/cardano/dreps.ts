import type { NexusClient } from "../../client.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";
import { NexusApiError } from "../../errors.js";

const enc = encodeURIComponent;

/** GET /api/dreps — list DReps with optional search/status/sort filters. */
export function getDReps(
  client: NexusClient,
  opts?: { search?: string; status?: string; sort?: string } & PageOptions,
): Promise<GetJson<"/api/dreps">> {
  return client.get("/api/dreps", {
    ...pageQuery(opts),
    search: opts?.search,
    status: opts?.status,
    sort: opts?.sort,
  });
}

/** GET /api/dreps/{drepId} — single DRep by id; null when not found. */
export async function getDRep(
  client: NexusClient,
  drepId: string,
): Promise<GetJson<"/api/dreps/{drepId}"> | null> {
  try {
    return await client.get(`/api/dreps/${enc(drepId)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/dreps/{drepId}/delegators — delegators for a DRep. */
export function getDRepDelegators(
  client: NexusClient,
  drepId: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/dreps/{drepId}/delegators">> {
  return client.get(`/api/dreps/${enc(drepId)}/delegators`, pageQuery(opts));
}

/** Namespace fragment: `client.cardano.dreps.*`. */
export function bindDReps(client: NexusClient) {
  return {
    list: (opts?: { search?: string; status?: string; sort?: string } & PageOptions) =>
      getDReps(client, opts),
    byId: (drepId: string) => getDRep(client, drepId),
    delegators: (drepId: string, opts?: PageOptions) =>
      getDRepDelegators(client, drepId, opts),
  } as const;
}
