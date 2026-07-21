import type { NexusClient } from "../client.js";
import { NexusApiError } from "../errors.js";
import type { NexusOutRefRequest, NexusOutRefUtxo, NexusRedeemerEval } from "../types.js";

const OUT_REF_BATCH = 100;

export async function getUtxosByOutRefs(
  client: NexusClient,
  outRefs: NexusOutRefRequest[],
): Promise<NexusOutRefUtxo[]> {
  const results: NexusOutRefUtxo[] = [];
  for (let i = 0; i < outRefs.length; i += OUT_REF_BATCH) {
    const chunk = outRefs.slice(i, i + OUT_REF_BATCH);
    results.push(...(await client.post<NexusOutRefUtxo[]>("/api/transactions/utxos", chunk)));
  }
  return results;
}

export async function getTransaction(
  client: NexusClient,
  txHash: string,
): Promise<unknown | null> {
  try {
    return await client.get(`/api/transactions/${encodeURIComponent(txHash)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

export function submitTx(client: NexusClient, cborHex: string): Promise<string> {
  return client.postText("/api/transactions/submit", cborHex);
}

export function evaluateTx(
  client: NexusClient,
  cborHex: string,
  additionalUtxoSet?: unknown[],
): Promise<NexusRedeemerEval[]> {
  return client.post("/api/transactions/evaluate", {
    cbor: cborHex,
    additionalUtxoSet: additionalUtxoSet ?? null,
  });
}
