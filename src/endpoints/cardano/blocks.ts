import type { NexusClient } from "../../client.js";
import { NexusApiError } from "../../errors.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/blocks — paginated list of recent blocks. */
export function getBlocks(
  client: NexusClient,
  opts?: PageOptions,
): Promise<GetJson<"/api/blocks">> {
  return client.get("/api/blocks", pageQuery(opts));
}

/** GET /api/blocks/latest — the latest block. */
export function getLatestBlock(client: NexusClient): Promise<GetJson<"/api/blocks/latest">> {
  return client.get("/api/blocks/latest");
}

/** GET /api/blocks/{hash} — a single block by hash; null when not found. */
export async function getBlock(
  client: NexusClient,
  hash: string,
): Promise<GetJson<"/api/blocks/{hash}"> | null> {
  try {
    return await client.get(`/api/blocks/${enc(hash)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** Namespace fragment: `client.cardano.blocks.*`. */
export function bindBlocks(client: NexusClient) {
  return {
    list: (opts?: PageOptions) => getBlocks(client, opts),
    latest: () => getLatestBlock(client),
    byHash: (hash: string) => getBlock(client, hash),
  } as const;
}
