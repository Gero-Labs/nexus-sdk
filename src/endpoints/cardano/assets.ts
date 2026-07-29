import type { NexusClient } from "../../client.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/assets/blacklist — blacklisted asset policy IDs. */
export function getAssetBlacklist(
  client: NexusClient,
): Promise<GetJson<"/api/assets/blacklist">> {
  return client.get("/api/assets/blacklist");
}

/** GET /api/assets/detailedInfo — detailed information for an asset (policy + name). */
export function getAssetDetailedInfo(
  client: NexusClient,
  assetPolicy: string,
  assetName: string,
): Promise<GetJson<"/api/assets/detailedInfo">> {
  return client.get("/api/assets/detailedInfo", { assetPolicy, assetName });
}

/** GET /api/assets/nft-address — the address currently holding an NFT (policy + name). */
export function getAssetNftAddress(
  client: NexusClient,
  assetPolicy: string,
  assetName: string,
): Promise<GetJson<"/api/assets/nft-address">> {
  return client.get("/api/assets/nft-address", { assetPolicy, assetName });
}

/** GET /api/assets/{unit}/holders — addresses currently holding an asset. */
export function getAssetHolders(
  client: NexusClient,
  unit: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/assets/{unit}/holders">> {
  return client.get(`/api/assets/${enc(unit)}/holders`, pageQuery(opts));
}

/** GET /api/assets/{unit}/utxos — UTxOs currently holding an asset. */
export function getAssetUtxos(
  client: NexusClient,
  unit: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/assets/{unit}/utxos">> {
  return client.get(`/api/assets/${enc(unit)}/utxos`, pageQuery(opts));
}

/** Namespace fragment: `client.cardano.assets.*`. */
export function bindAssets(client: NexusClient) {
  return {
    blacklist: () => getAssetBlacklist(client),
    detailedInfo: (assetPolicy: string, assetName: string) =>
      getAssetDetailedInfo(client, assetPolicy, assetName),
    nftAddress: (assetPolicy: string, assetName: string) =>
      getAssetNftAddress(client, assetPolicy, assetName),
    holders: (unit: string, opts?: PageOptions) => getAssetHolders(client, unit, opts),
    utxos: (unit: string, opts?: PageOptions) => getAssetUtxos(client, unit, opts),
  } as const;
}
