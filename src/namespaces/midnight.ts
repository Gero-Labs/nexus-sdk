import type { NexusClient } from "../client.js";
import { bindDust } from "../endpoints/midnight/dust.js";
import { bindIndexer } from "../endpoints/midnight/indexer.js";
import { bindInfo } from "../endpoints/midnight/info.js";
import { bindTx } from "../endpoints/midnight/tx.js";

/** Builds `client.midnight.*` — info, transactions, DUST registration/state, indexer GraphQL. */
export function makeMidnight(client: NexusClient) {
  return {
    info: bindInfo(client),
    tx: bindTx(client),
    dust: bindDust(client),
    indexer: bindIndexer(client),
  } as const;
}

export type MidnightNamespace = ReturnType<typeof makeMidnight>;
