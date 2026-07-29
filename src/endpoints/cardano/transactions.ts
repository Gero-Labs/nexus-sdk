import type { NexusClient } from "../../client.js";
import { type GetJson, type PostBody, type PostJson } from "../../http.js";
import { NexusApiError } from "../../errors.js";

const enc = encodeURIComponent;

/** GET /api/transactions/{txHash} — transaction details by hash; null when not found. */
export async function getTransaction(
  client: NexusClient,
  txHash: string,
): Promise<GetJson<"/api/transactions/{txHash}"> | null> {
  try {
    return await client.get(`/api/transactions/${enc(txHash)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/transactions/{txHash}/utxos — inputs/outputs for a transaction. */
export function getTransactionUtxos(
  client: NexusClient,
  txHash: string,
): Promise<GetJson<"/api/transactions/{txHash}/utxos">> {
  return client.get(`/api/transactions/${enc(txHash)}/utxos`);
}

/** GET /api/transactions/{txHash}/cbor — raw transaction CBOR by hash. */
export function getTransactionCbor(
  client: NexusClient,
  txHash: string,
): Promise<GetJson<"/api/transactions/{txHash}/cbor">> {
  return client.get(`/api/transactions/${enc(txHash)}/cbor`);
}

/** POST /api/transactions/utxos — batch resolve UTxOs for multiple output references. */
export function getTransactionUtxosBatch(
  client: NexusClient,
  body: PostBody<"/api/transactions/utxos">,
): Promise<PostJson<"/api/transactions/utxos">> {
  return client.post("/api/transactions/utxos", body);
}

/** POST /api/transactions/cbor — batch fetch raw transaction CBOR for multiple hashes. */
export function getTransactionCborBatch(
  client: NexusClient,
  body: PostBody<"/api/transactions/cbor">,
): Promise<PostJson<"/api/transactions/cbor">> {
  return client.post("/api/transactions/cbor", body);
}

/** POST /api/transactions/evaluate — evaluate redeemer execution-unit budgets. */
export function evaluateTransaction(
  client: NexusClient,
  body: PostBody<"/api/transactions/evaluate">,
): Promise<PostJson<"/api/transactions/evaluate">> {
  return client.post("/api/transactions/evaluate", body);
}

/** POST /api/transactions/submit — submit a serialized transaction; returns the tx hash as plain text. */
export function submitTransaction(client: NexusClient, cborHex: string): Promise<string> {
  return client.postText("/api/transactions/submit", cborHex);
}

/** Namespace fragment: `client.cardano.transactions.*`. */
export function bindTransactions(client: NexusClient) {
  return {
    byHash: (txHash: string) => getTransaction(client, txHash),
    utxos: (txHash: string) => getTransactionUtxos(client, txHash),
    cbor: (txHash: string) => getTransactionCbor(client, txHash),
    utxosBatch: (body: PostBody<"/api/transactions/utxos">) =>
      getTransactionUtxosBatch(client, body),
    cborBatch: (body: PostBody<"/api/transactions/cbor">) =>
      getTransactionCborBatch(client, body),
    evaluate: (body: PostBody<"/api/transactions/evaluate">) =>
      evaluateTransaction(client, body),
    submit: (cborHex: string) => submitTransaction(client, cborHex),
  } as const;
}
