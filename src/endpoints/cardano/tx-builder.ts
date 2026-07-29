import type { NexusClient } from "../../client.js";
import { type PostBody, type PostJson } from "../../http.js";

/** POST /api/tx/build — build an unsigned transaction from a build request. */
export function buildTransaction(
  client: NexusClient,
  body: PostBody<"/api/tx/build">,
): Promise<PostJson<"/api/tx/build">> {
  return client.post("/api/tx/build", body);
}

/** POST /api/tx/build/delegation — build a stake-delegation transaction. */
export function buildDelegation(
  client: NexusClient,
  body: PostBody<"/api/tx/build/delegation">,
): Promise<PostJson<"/api/tx/build/delegation">> {
  return client.post("/api/tx/build/delegation", body);
}

/** POST /api/tx/build/stake-registration — build a stake-registration transaction. */
export function buildStakeRegistration(
  client: NexusClient,
  body: PostBody<"/api/tx/build/stake-registration">,
): Promise<PostJson<"/api/tx/build/stake-registration">> {
  return client.post("/api/tx/build/stake-registration", body);
}

/** POST /api/tx/build/vote-delegation — build a vote-delegation transaction. */
export function buildVoteDelegation(
  client: NexusClient,
  body: PostBody<"/api/tx/build/vote-delegation">,
): Promise<PostJson<"/api/tx/build/vote-delegation">> {
  return client.post("/api/tx/build/vote-delegation", body);
}

/** POST /api/tx/build/drep-registration — build a DRep-registration transaction. */
export function buildDRepRegistration(
  client: NexusClient,
  body: PostBody<"/api/tx/build/drep-registration">,
): Promise<PostJson<"/api/tx/build/drep-registration">> {
  return client.post("/api/tx/build/drep-registration", body);
}

/** POST /api/tx/build/withdrawal — build a reward-withdrawal transaction. */
export function buildWithdrawal(
  client: NexusClient,
  body: PostBody<"/api/tx/build/withdrawal">,
): Promise<PostJson<"/api/tx/build/withdrawal">> {
  return client.post("/api/tx/build/withdrawal", body);
}

/** POST /api/tx/max-ada — compute the maximum sendable ADA for a build request. */
export function maxAda(
  client: NexusClient,
  body: PostBody<"/api/tx/max-ada">,
): Promise<PostJson<"/api/tx/max-ada">> {
  return client.post("/api/tx/max-ada", body);
}

/** Namespace fragment: `client.cardano.txBuilder.*`. */
export function bindTxBuilder(client: NexusClient) {
  return {
    build: (body: PostBody<"/api/tx/build">) => buildTransaction(client, body),
    delegation: (body: PostBody<"/api/tx/build/delegation">) =>
      buildDelegation(client, body),
    stakeRegistration: (body: PostBody<"/api/tx/build/stake-registration">) =>
      buildStakeRegistration(client, body),
    voteDelegation: (body: PostBody<"/api/tx/build/vote-delegation">) =>
      buildVoteDelegation(client, body),
    drepRegistration: (body: PostBody<"/api/tx/build/drep-registration">) =>
      buildDRepRegistration(client, body),
    withdrawal: (body: PostBody<"/api/tx/build/withdrawal">) =>
      buildWithdrawal(client, body),
    maxAda: (body: PostBody<"/api/tx/max-ada">) => maxAda(client, body),
  } as const;
}
