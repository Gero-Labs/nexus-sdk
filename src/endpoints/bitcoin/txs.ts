import type { NexusClient } from "../../client.js";
import { NexusApiError } from "../../errors.js";
import type { GetJson, PostBody, PostJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/btc/txs/{txid} — a single transaction by txid; null when not found. */
export async function getTransaction(
  client: NexusClient,
  txid: string,
): Promise<GetJson<"/api/btc/txs/{txid}"> | null> {
  try {
    return await client.get(`/api/btc/txs/${enc(txid)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/btc/txs/{txid}/hex — raw transaction hex by txid; null when not found. */
export async function getTransactionHex(
  client: NexusClient,
  txid: string,
): Promise<string | null> {
  try {
    return await client.getText(`/api/btc/txs/${enc(txid)}/hex`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** POST /api/btc/txs/submit — broadcast a hex-encoded signed transaction. */
export function submitTransaction(
  client: NexusClient,
  body: PostBody<"/api/btc/txs/submit">,
): Promise<PostJson<"/api/btc/txs/submit">> {
  return client.post("/api/btc/txs/submit", body);
}

/** Namespace fragment: `client.bitcoin.txs.*`. */
export function bindTxs(client: NexusClient) {
  return {
    byId: (txid: string) => getTransaction(client, txid),
    hex: (txid: string) => getTransactionHex(client, txid),
    submit: (body: PostBody<"/api/btc/txs/submit">) => submitTransaction(client, body),
  } as const;
}
