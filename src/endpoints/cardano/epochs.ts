import type { NexusClient } from "../../client.js";
import type { GetJson } from "../../http.js";

/** GET /api/epoch/latest — the current epoch. */
export function getLatestEpoch(client: NexusClient): Promise<GetJson<"/api/epoch/latest">> {
  return client.get("/api/epoch/latest");
}

/** GET /api/epoch/latest/parameters — protocol parameters for the current epoch. */
export function getLatestEpochParameters(
  client: NexusClient,
): Promise<GetJson<"/api/epoch/latest/parameters">> {
  return client.get("/api/epoch/latest/parameters");
}

/** GET /api/epoch/params — protocol parameters for a given epoch (latest when omitted). */
export function getEpochParams(
  client: NexusClient,
  opts?: { epoch_no?: number },
): Promise<GetJson<"/api/epoch/params">> {
  return client.get("/api/epoch/params", { epoch_no: opts?.epoch_no });
}

/** Namespace fragment: `client.cardano.epochs.*`. */
export function bindEpochs(client: NexusClient) {
  return {
    latest: () => getLatestEpoch(client),
    latestParameters: () => getLatestEpochParameters(client),
    params: (opts?: { epoch_no?: number }) => getEpochParams(client, opts),
  } as const;
}
