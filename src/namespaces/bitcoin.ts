import type { NexusClient } from "../client.js";
import { bindAddresses } from "../endpoints/bitcoin/addresses.js";
import { bindBlocks } from "../endpoints/bitcoin/blocks.js";
import { bindChain } from "../endpoints/bitcoin/chain.js";
import { bindFees } from "../endpoints/bitcoin/fees.js";
import { bindMempool } from "../endpoints/bitcoin/mempool.js";
import { bindOrdinals } from "../endpoints/bitcoin/ordinals.js";
import { bindTxs } from "../endpoints/bitcoin/txs.js";

/** Builds `client.bitcoin.*` — addresses, transactions, blocks, fees, mempool, chain, ordinals. */
export function makeBitcoin(client: NexusClient) {
  return {
    addresses: bindAddresses(client),
    txs: bindTxs(client),
    blocks: bindBlocks(client),
    fees: bindFees(client),
    mempool: bindMempool(client),
    chain: bindChain(client),
    ordinals: bindOrdinals(client),
  } as const;
}

export type BitcoinNamespace = ReturnType<typeof makeBitcoin>;
