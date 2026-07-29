import type { NexusClient } from "../../client.js";
import { NexusApiError } from "../../errors.js";
import type { GetJson, PostBody, PostJson } from "../../http.js";

const enc = encodeURIComponent;

/** GET /api/midnight/{network}/dust/account-state/{address} — current DUST account state for an address; null when not found. */
export async function getAccountState(
  client: NexusClient,
  network: string,
  address: string,
): Promise<GetJson<"/api/midnight/{network}/dust/account-state/{address}"> | null> {
  try {
    return await client.get(
      `/api/midnight/${enc(network)}/dust/account-state/${enc(address)}`,
    );
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/midnight/{network}/dust/status — DUST registration status for a single Cardano reward address. */
export function getStatus(
  client: NexusClient,
  network: string,
  cardanoRewardAddress: string,
): Promise<GetJson<"/api/midnight/{network}/dust/status">> {
  return client.get(`/api/midnight/${enc(network)}/dust/status`, {
    cardanoRewardAddress,
  });
}

/** GET /api/midnight/{network}/dust/registrations — the caller's live DUST registration UTxOs. */
export function getRegistrations(
  client: NexusClient,
  network: string,
  cardanoRewardAddress: string,
): Promise<GetJson<"/api/midnight/{network}/dust/registrations">> {
  return client.get(`/api/midnight/${enc(network)}/dust/registrations`, {
    cardanoRewardAddress,
  });
}

/** GET /api/midnight/{network}/dust/state-snapshot — dust-ledger sync-bootstrap snapshot before a registration time. */
export function getStateSnapshot(
  client: NexusClient,
  network: string,
  registeredAt: string,
): Promise<GetJson<"/api/midnight/{network}/dust/state-snapshot">> {
  return client.get(`/api/midnight/${enc(network)}/dust/state-snapshot`, {
    registeredAt,
  });
}

/** POST /api/midnight/{network}/dust/status/batch — batch-fetch DUST status for up to 50 reward addresses. */
export function getStatusBatch(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/dust/status/batch">,
): Promise<PostJson<"/api/midnight/{network}/dust/status/batch">> {
  return client.post(`/api/midnight/${enc(network)}/dust/status/batch`, body);
}

/** POST /api/midnight/{network}/dust/build-registration-tx — build the unsigned DUST registration Cardano tx. */
export function buildRegistrationTx(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/dust/build-registration-tx">,
): Promise<PostJson<"/api/midnight/{network}/dust/build-registration-tx">> {
  return client.post(`/api/midnight/${enc(network)}/dust/build-registration-tx`, body);
}

/** POST /api/midnight/{network}/dust/build-deregistration-tx — build the unsigned DUST deregistration Cardano tx. */
export function buildDeregistrationTx(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/dust/build-deregistration-tx">,
): Promise<PostJson<"/api/midnight/{network}/dust/build-deregistration-tx">> {
  return client.post(`/api/midnight/${enc(network)}/dust/build-deregistration-tx`, body);
}

/** POST /api/midnight/{network}/dust/build-update-tx — build the unsigned DUST mapping update Cardano tx. */
export function buildUpdateTx(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/dust/build-update-tx">,
): Promise<PostJson<"/api/midnight/{network}/dust/build-update-tx">> {
  return client.post(`/api/midnight/${enc(network)}/dust/build-update-tx`, body);
}

/** POST /api/midnight/{network}/dust/build-night-registration — build the Midnight-native DUST registration tx (Path A). */
export function buildNightRegistration(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/dust/build-night-registration">,
): Promise<PostJson<"/api/midnight/{network}/dust/build-night-registration">> {
  return client.post(`/api/midnight/${enc(network)}/dust/build-night-registration`, body);
}

/** POST /api/midnight/{network}/dust/submit-night-registration — submit the wallet-signed Midnight DUST registration tx. */
export function submitNightRegistration(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/dust/submit-night-registration">,
): Promise<PostJson<"/api/midnight/{network}/dust/submit-night-registration">> {
  return client.post(`/api/midnight/${enc(network)}/dust/submit-night-registration`, body);
}

/** Namespace fragment: `client.midnight.dust.*`. */
export function bindDust(client: NexusClient) {
  return {
    accountState: (network: string, address: string) =>
      getAccountState(client, network, address),
    status: (network: string, cardanoRewardAddress: string) =>
      getStatus(client, network, cardanoRewardAddress),
    registrations: (network: string, cardanoRewardAddress: string) =>
      getRegistrations(client, network, cardanoRewardAddress),
    stateSnapshot: (network: string, registeredAt: string) =>
      getStateSnapshot(client, network, registeredAt),
    statusBatch: (
      network: string,
      body: PostBody<"/api/midnight/{network}/dust/status/batch">,
    ) => getStatusBatch(client, network, body),
    buildRegistrationTx: (
      network: string,
      body: PostBody<"/api/midnight/{network}/dust/build-registration-tx">,
    ) => buildRegistrationTx(client, network, body),
    buildDeregistrationTx: (
      network: string,
      body: PostBody<"/api/midnight/{network}/dust/build-deregistration-tx">,
    ) => buildDeregistrationTx(client, network, body),
    buildUpdateTx: (
      network: string,
      body: PostBody<"/api/midnight/{network}/dust/build-update-tx">,
    ) => buildUpdateTx(client, network, body),
    buildNightRegistration: (
      network: string,
      body: PostBody<"/api/midnight/{network}/dust/build-night-registration">,
    ) => buildNightRegistration(client, network, body),
    submitNightRegistration: (
      network: string,
      body: PostBody<"/api/midnight/{network}/dust/submit-night-registration">,
    ) => submitNightRegistration(client, network, body),
  } as const;
}
