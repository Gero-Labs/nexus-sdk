import type { NexusClient } from "../../client.js";
import { NexusApiError } from "../../errors.js";
import type { GetJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/scripts/{scriptHash} — a script by hash; null when not found. */
export async function getScript(
  client: NexusClient,
  scriptHash: string,
): Promise<GetJson<"/api/scripts/{scriptHash}"> | null> {
  try {
    return await client.get(`/api/scripts/${enc(scriptHash)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/scripts/datum/{datumHash} — a datum by hash; null when not found. */
export async function getDatum(
  client: NexusClient,
  datumHash: string,
): Promise<GetJson<"/api/scripts/datum/{datumHash}"> | null> {
  try {
    return await client.get(`/api/scripts/datum/${enc(datumHash)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** Namespace fragment: `client.cardano.scripts.*`. */
export function bindScripts(client: NexusClient) {
  return {
    byHash: (scriptHash: string) => getScript(client, scriptHash),
    datum: (datumHash: string) => getDatum(client, datumHash),
  } as const;
}
