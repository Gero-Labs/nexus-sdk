import type { NexusClient } from "../../client.js";
import { NexusApiError } from "../../errors.js";
import type { GetJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/btc/blocks — most recent N blocks (descending height). */
export function getRecentBlocks(
  client: NexusClient,
  opts?: { limit?: number },
): Promise<GetJson<"/api/btc/blocks">> {
  return client.get("/api/btc/blocks", { limit: opts?.limit });
}

/** GET /api/btc/blocks/{idOrHeight} — a single block by hash or height; null when not found. */
export async function getBlock(
  client: NexusClient,
  idOrHeight: string | number,
): Promise<GetJson<"/api/btc/blocks/{idOrHeight}"> | null> {
  try {
    return await client.get(`/api/btc/blocks/${enc(String(idOrHeight))}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** Namespace fragment: `client.bitcoin.blocks.*`. */
export function bindBlocks(client: NexusClient) {
  return {
    recent: (opts?: { limit?: number }) => getRecentBlocks(client, opts),
    byIdOrHeight: (idOrHeight: string | number) => getBlock(client, idOrHeight),
  } as const;
}
