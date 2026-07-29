import type { NexusClient } from "../../client.js";
import type { GetJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/midnight/{network}/info — network endpoints + current era for WalletFacade.init(). */
export function getInfo(
  client: NexusClient,
  network: string,
): Promise<GetJson<"/api/midnight/{network}/info">> {
  return client.get(`/api/midnight/${enc(network)}/info`);
}

/** Namespace fragment: `client.midnight.info.*`. */
export function bindInfo(client: NexusClient) {
  return {
    get: (network: string) => getInfo(client, network),
  } as const;
}
