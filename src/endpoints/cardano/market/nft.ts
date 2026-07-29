import type { NexusClient } from "../../../client.js";
import { NexusApiError } from "../../../errors.js";
import type { GetJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

const enc = encodeURIComponent;

/** GET /api/nft/collections — NFT collection stats. */
export function getNftCollections(
  client: NexusClient,
  opts?: { sort?: string; limit?: number },
): Promise<GetJson<"/api/nft/collections">> {
  assertMarketMainnet(client);
  return client.get("/api/nft/collections", { sort: opts?.sort, limit: opts?.limit });
}

/** GET /api/nft/collection/{policyId} — stats for one collection; null when not found. */
export async function getNftCollection(
  client: NexusClient,
  policyId: string,
): Promise<GetJson<"/api/nft/collection/{policyId}"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/nft/collection/${enc(policyId)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/nft/collection/{policyId}/floor — floor price for a collection; null when not found. */
export async function getNftCollectionFloor(
  client: NexusClient,
  policyId: string,
): Promise<GetJson<"/api/nft/collection/{policyId}/floor"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/nft/collection/${enc(policyId)}/floor`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/nft/collection/{policyId}/sales — recent sales for a collection. */
export function getNftCollectionSales(
  client: NexusClient,
  policyId: string,
  opts?: { limit?: number },
): Promise<GetJson<"/api/nft/collection/{policyId}/sales">> {
  assertMarketMainnet(client);
  return client.get(`/api/nft/collection/${enc(policyId)}/sales`, { limit: opts?.limit });
}

/** GET /api/nft/asset/{policyId}/{assetName}/price — price for one NFT asset; null when not found. */
export async function getNftAssetPrice(
  client: NexusClient,
  policyId: string,
  assetName: string,
): Promise<GetJson<"/api/nft/asset/{policyId}/{assetName}/price"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/nft/asset/${enc(policyId)}/${enc(assetName)}/price`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** Namespace fragment: `client.cardano.nft.*`. */
export function bindNft(client: NexusClient) {
  return {
    collections: (opts?: { sort?: string; limit?: number }) => getNftCollections(client, opts),
    collection: (policyId: string) => getNftCollection(client, policyId),
    floor: (policyId: string) => getNftCollectionFloor(client, policyId),
    sales: (policyId: string, opts?: { limit?: number }) =>
      getNftCollectionSales(client, policyId, opts),
    assetPrice: (policyId: string, assetName: string) =>
      getNftAssetPrice(client, policyId, assetName),
  } as const;
}
