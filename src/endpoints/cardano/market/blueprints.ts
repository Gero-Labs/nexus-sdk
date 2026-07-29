import type { NexusClient } from "../../../client.js";
import { NexusApiError } from "../../../errors.js";
import { type DeleteJson, type GetJson, type PostBody, type PostJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

const enc = encodeURIComponent;

/** GET /api/blueprints — registered DApp blueprints. */
export function getBlueprints(client: NexusClient): Promise<GetJson<"/api/blueprints">> {
  assertMarketMainnet(client);
  return client.get("/api/blueprints");
}

/** GET /api/blueprints/{id} — a blueprint by id; null when not found. */
export async function getBlueprint(
  client: NexusClient,
  id: string,
): Promise<GetJson<"/api/blueprints/{id}"> | null> {
  assertMarketMainnet(client);
  try {
    return await client.get(`/api/blueprints/${enc(id)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/blueprints/{id}/events — persisted events emitted by a blueprint. */
export function getBlueprintEvents(
  client: NexusClient,
  id: string,
  opts?: { page?: number; size?: number; phase?: string; sinceId?: number; fromSlot?: number },
): Promise<GetJson<"/api/blueprints/{id}/events">> {
  assertMarketMainnet(client);
  return client.get(`/api/blueprints/${enc(id)}/events`, {
    page: opts?.page,
    size: opts?.size,
    phase: opts?.phase,
    sinceId: opts?.sinceId,
    fromSlot: opts?.fromSlot,
  });
}

/** POST /api/blueprints — register a new blueprint. */
export function createBlueprint(
  client: NexusClient,
  body: PostBody<"/api/blueprints">,
): Promise<PostJson<"/api/blueprints">> {
  assertMarketMainnet(client);
  return client.post("/api/blueprints", body);
}

/** DELETE /api/blueprints/{id} — remove a registered blueprint. */
export function deleteBlueprint(
  client: NexusClient,
  id: string,
): Promise<DeleteJson<"/api/blueprints/{id}">> {
  assertMarketMainnet(client);
  return client.del(`/api/blueprints/${enc(id)}`);
}

/** Namespace fragment: `client.cardano.blueprints.*`. */
export function bindBlueprints(client: NexusClient) {
  return {
    list: () => getBlueprints(client),
    byId: (id: string) => getBlueprint(client, id),
    remove: (id: string) => deleteBlueprint(client, id),
    events: (
      id: string,
      opts?: {
        page?: number;
        size?: number;
        phase?: string;
        sinceId?: number;
        fromSlot?: number;
      },
    ) => getBlueprintEvents(client, id, opts),
    create: (body: PostBody<"/api/blueprints">) => createBlueprint(client, body),
  } as const;
}
