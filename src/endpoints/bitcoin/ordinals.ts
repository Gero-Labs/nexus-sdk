import type { NexusClient } from "../../client.js";
import { NexusApiError } from "../../errors.js";
import type { GetJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/btc/ordinals/inscriptions/{id} — inscription metadata by inscription ID; null when not found. */
export async function getInscription(
  client: NexusClient,
  id: string,
): Promise<GetJson<"/api/btc/ordinals/inscriptions/{id}"> | null> {
  try {
    return await client.get(`/api/btc/ordinals/inscriptions/${enc(id)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/btc/ordinals/outputs/{outpoint} — inscription IDs + rune balances carried by a UTxO outpoint; null when not found. */
export async function getOutput(
  client: NexusClient,
  outpoint: string,
): Promise<GetJson<"/api/btc/ordinals/outputs/{outpoint}"> | null> {
  try {
    return await client.get(`/api/btc/ordinals/outputs/${enc(outpoint)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/btc/ordinals/runes/{rune} — rune metadata by ID (block:tx) or spaced rune name; null when not found. */
export async function getRune(
  client: NexusClient,
  rune: string,
): Promise<GetJson<"/api/btc/ordinals/runes/{rune}"> | null> {
  try {
    return await client.get(`/api/btc/ordinals/runes/${enc(rune)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** Namespace fragment: `client.bitcoin.ordinals.*`. */
export function bindOrdinals(client: NexusClient) {
  return {
    inscription: (id: string) => getInscription(client, id),
    output: (outpoint: string) => getOutput(client, outpoint),
    rune: (rune: string) => getRune(client, rune),
  } as const;
}
