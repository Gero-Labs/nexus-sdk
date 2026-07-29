import type { NexusClient } from "../../client.js";
import { NexusApiError } from "../../errors.js";
import type { GetJson, PostBody, PostJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/midnight/{network}/transactions/{txHash}/utxos — unshielded-UTXO view of a tx; null when not found. */
export async function getTransactionUtxos(
  client: NexusClient,
  network: string,
  txHash: string,
): Promise<GetJson<"/api/midnight/{network}/transactions/{txHash}/utxos"> | null> {
  try {
    return await client.get(
      `/api/midnight/${enc(network)}/transactions/${enc(txHash)}/utxos`,
    );
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** POST /api/midnight/{network}/tx/build-unshielded — build an unproven NIGHT transfer tx. */
export function buildUnshielded(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/tx/build-unshielded">,
): Promise<PostJson<"/api/midnight/{network}/tx/build-unshielded">> {
  return client.post(`/api/midnight/${enc(network)}/tx/build-unshielded`, body);
}

/** POST /api/midnight/{network}/tx/submit — submit a signed (unproven) Midnight tx; sidecar finalizes. */
export function submit(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/tx/submit">,
): Promise<PostJson<"/api/midnight/{network}/tx/submit">> {
  return client.post(`/api/midnight/${enc(network)}/tx/submit`, body);
}

/** POST /api/midnight/{network}/tx/submit-proven — submit an already-proven Midnight tx. */
export function submitProven(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/tx/submit-proven">,
): Promise<PostJson<"/api/midnight/{network}/tx/submit-proven">> {
  return client.post(`/api/midnight/${enc(network)}/tx/submit-proven`, body);
}

/** POST /api/midnight/{network}/tx/prove-and-submit — prove + bind + submit a shielded Midnight tx. */
export function proveAndSubmit(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/tx/prove-and-submit">,
): Promise<PostJson<"/api/midnight/{network}/tx/prove-and-submit">> {
  return client.post(`/api/midnight/${enc(network)}/tx/prove-and-submit`, body);
}

/** Namespace fragment: `client.midnight.tx.*`. */
export function bindTx(client: NexusClient) {
  return {
    utxos: (network: string, txHash: string) => getTransactionUtxos(client, network, txHash),
    buildUnshielded: (
      network: string,
      body: PostBody<"/api/midnight/{network}/tx/build-unshielded">,
    ) => buildUnshielded(client, network, body),
    submit: (network: string, body: PostBody<"/api/midnight/{network}/tx/submit">) =>
      submit(client, network, body),
    submitProven: (
      network: string,
      body: PostBody<"/api/midnight/{network}/tx/submit-proven">,
    ) => submitProven(client, network, body),
    proveAndSubmit: (
      network: string,
      body: PostBody<"/api/midnight/{network}/tx/prove-and-submit">,
    ) => proveAndSubmit(client, network, body),
  } as const;
}
