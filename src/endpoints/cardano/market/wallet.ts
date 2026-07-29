import type { NexusClient } from "../../../client.js";
import { type GetJson, type PostBody, type PostJson } from "../../../http.js";
import { assertMarketMainnet } from "../../../market-guard.js";

const enc = encodeURIComponent;

/** GET /api/wallet/{stakeAddress}/pnl — realized/unrealized P&L for a wallet. */
export function getWalletPnl(
  client: NexusClient,
  stakeAddress: string,
): Promise<GetJson<"/api/wallet/{stakeAddress}/pnl">> {
  assertMarketMainnet(client);
  return client.get(`/api/wallet/${enc(stakeAddress)}/pnl`);
}

/** GET /api/wallet/{stakeAddress}/holdings — current token holdings for a wallet. */
export function getWalletHoldings(
  client: NexusClient,
  stakeAddress: string,
): Promise<GetJson<"/api/wallet/{stakeAddress}/holdings">> {
  assertMarketMainnet(client);
  return client.get(`/api/wallet/${enc(stakeAddress)}/holdings`);
}

/** GET /api/wallet/{stakeAddress}/history — portfolio value history for a wallet. */
export function getWalletHistory(
  client: NexusClient,
  stakeAddress: string,
  opts?: { resolution?: string; adaOnly?: boolean },
): Promise<GetJson<"/api/wallet/{stakeAddress}/history">> {
  assertMarketMainnet(client);
  return client.get(`/api/wallet/${enc(stakeAddress)}/history`, {
    resolution: opts?.resolution,
    adaOnly: opts?.adaOnly === undefined ? undefined : String(opts.adaOnly),
  });
}

/** POST /api/wallet/pnl — FIFO P&L aggregated across multiple wallets. */
export function getMultiWalletPnl(
  client: NexusClient,
  body: PostBody<"/api/wallet/pnl">,
): Promise<PostJson<"/api/wallet/pnl">> {
  assertMarketMainnet(client);
  return client.post("/api/wallet/pnl", body);
}

/** Namespace fragment: `client.cardano.wallet.*`. */
export function bindWallet(client: NexusClient) {
  return {
    pnl: (stakeAddress: string) => getWalletPnl(client, stakeAddress),
    holdings: (stakeAddress: string) => getWalletHoldings(client, stakeAddress),
    history: (stakeAddress: string, opts?: { resolution?: string; adaOnly?: boolean }) =>
      getWalletHistory(client, stakeAddress, opts),
    multiPnl: (body: PostBody<"/api/wallet/pnl">) => getMultiWalletPnl(client, body),
  } as const;
}
