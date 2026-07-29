import type { NexusClient } from "../../client.js";
import { type GetJson, type PageOptions, pageQuery } from "../../http.js";
import { NexusApiError } from "../../errors.js";

const enc = encodeURIComponent;

/** GET /api/governance/committee — current constitutional committee. */
export function getCommittee(
  client: NexusClient,
): Promise<GetJson<"/api/governance/committee">> {
  return client.get("/api/governance/committee");
}

/** GET /api/governance/constitution — current on-chain constitution. */
export function getConstitution(
  client: NexusClient,
): Promise<GetJson<"/api/governance/constitution">> {
  return client.get("/api/governance/constitution");
}

/** GET /api/governance/dreps — list governance DReps with optional filters. */
export function getGovernanceDReps(
  client: NexusClient,
  opts?: {
    search?: string;
    status?: string;
    sort?: string;
    hasMetadata?: boolean;
  } & PageOptions,
): Promise<GetJson<"/api/governance/dreps">> {
  return client.get("/api/governance/dreps", {
    ...pageQuery(opts),
    search: opts?.search,
    status: opts?.status,
    sort: opts?.sort,
    hasMetadata: opts?.hasMetadata === undefined ? undefined : String(opts.hasMetadata),
  });
}

/** GET /api/governance/dreps/{drepId} — single governance DRep by id; null when not found. */
export async function getGovernanceDRep(
  client: NexusClient,
  drepId: string,
): Promise<GetJson<"/api/governance/dreps/{drepId}"> | null> {
  try {
    return await client.get(`/api/governance/dreps/${enc(drepId)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/governance/dreps/{drepId}/delegators — delegators for a governance DRep. */
export function getGovernanceDRepDelegators(
  client: NexusClient,
  drepId: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/governance/dreps/{drepId}/delegators">> {
  return client.get(`/api/governance/dreps/${enc(drepId)}/delegators`, pageQuery(opts));
}

/** GET /api/governance/dreps/{drepId}/votes — votes cast by a governance DRep. */
export function getGovernanceDRepVotes(
  client: NexusClient,
  drepId: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/governance/dreps/{drepId}/votes">> {
  return client.get(`/api/governance/dreps/${enc(drepId)}/votes`, pageQuery(opts));
}

/** GET /api/governance/proposals — list governance proposals with optional filters. */
export function getProposals(
  client: NexusClient,
  opts?: { type?: string; status?: string } & PageOptions,
): Promise<GetJson<"/api/governance/proposals">> {
  return client.get("/api/governance/proposals", {
    ...pageQuery(opts),
    type: opts?.type,
    status: opts?.status,
  });
}

/** GET /api/governance/proposals/{govActionId} — single proposal by governance action id; null when not found. */
export async function getProposal(
  client: NexusClient,
  govActionId: string,
): Promise<GetJson<"/api/governance/proposals/{govActionId}"> | null> {
  try {
    return await client.get(`/api/governance/proposals/${enc(govActionId)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /api/governance/proposals/{govActionId}/votes — votes on a proposal. */
export function getProposalVotes(
  client: NexusClient,
  govActionId: string,
  opts?: PageOptions,
): Promise<GetJson<"/api/governance/proposals/{govActionId}/votes">> {
  return client.get(`/api/governance/proposals/${enc(govActionId)}/votes`, pageQuery(opts));
}

/** GET /api/governance/proposals/{govActionId}/voting-summary — tallied voting summary for a proposal. */
export function getProposalVotingSummary(
  client: NexusClient,
  govActionId: string,
): Promise<GetJson<"/api/governance/proposals/{govActionId}/voting-summary">> {
  return client.get(`/api/governance/proposals/${enc(govActionId)}/voting-summary`);
}

/** Namespace fragment: `client.cardano.governance.*`. */
export function bindGovernance(client: NexusClient) {
  return {
    committee: () => getCommittee(client),
    constitution: () => getConstitution(client),
    dreps: (
      opts?: {
        search?: string;
        status?: string;
        sort?: string;
        hasMetadata?: boolean;
      } & PageOptions,
    ) => getGovernanceDReps(client, opts),
    drep: (drepId: string) => getGovernanceDRep(client, drepId),
    drepDelegators: (drepId: string, opts?: PageOptions) =>
      getGovernanceDRepDelegators(client, drepId, opts),
    drepVotes: (drepId: string, opts?: PageOptions) =>
      getGovernanceDRepVotes(client, drepId, opts),
    proposals: (opts?: { type?: string; status?: string } & PageOptions) =>
      getProposals(client, opts),
    proposal: (govActionId: string) => getProposal(client, govActionId),
    proposalVotes: (govActionId: string, opts?: PageOptions) =>
      getProposalVotes(client, govActionId, opts),
    votingSummary: (govActionId: string) =>
      getProposalVotingSummary(client, govActionId),
  } as const;
}
