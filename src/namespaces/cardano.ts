import type { NexusClient } from "../client.js";
import { bindAccounts } from "../endpoints/cardano/accounts.js";
import { bindAddresses } from "../endpoints/cardano/addresses.js";
import { bindAssets } from "../endpoints/cardano/assets.js";
import { bindBlocks } from "../endpoints/cardano/blocks.js";
import { bindDReps } from "../endpoints/cardano/dreps.js";
import { bindEpochs } from "../endpoints/cardano/epochs.js";
import { bindGovernance } from "../endpoints/cardano/governance.js";
import { bindNetwork } from "../endpoints/cardano/network.js";
import { bindPolicy } from "../endpoints/cardano/policy.js";
import { bindPools } from "../endpoints/cardano/pools.js";
import { bindScripts } from "../endpoints/cardano/scripts.js";
import { bindTransactions } from "../endpoints/cardano/transactions.js";
import { bindTxBuilder } from "../endpoints/cardano/tx-builder.js";
import { bindAggregator } from "../endpoints/cardano/market/aggregator.js";
import { bindBlueprints } from "../endpoints/cardano/market/blueprints.js";
import { bindDex } from "../endpoints/cardano/market/dex.js";
import { bindLeaderboard } from "../endpoints/cardano/market/leaderboard.js";
import { bindMarket } from "../endpoints/cardano/market/market.js";
import { bindNft } from "../endpoints/cardano/market/nft.js";
import { bindPrices } from "../endpoints/cardano/market/prices.js";
import { bindSync } from "../endpoints/cardano/market/sync.js";
import { bindWallet } from "../endpoints/cardano/market/wallet.js";

/**
 * Builds `client.cardano.*` — chain resources plus a mainnet-only `market` sub-namespace
 * (token market data, prices/candles, DEX, NFT, wallet PnL, aggregator, leaderboard, sync,
 * blueprints). Every `market` call fails fast on a non-mainnet client network.
 */
export function makeCardano(client: NexusClient) {
  return {
    addresses: bindAddresses(client),
    accounts: bindAccounts(client),
    assets: bindAssets(client),
    blocks: bindBlocks(client),
    epochs: bindEpochs(client),
    network: bindNetwork(client),
    policy: bindPolicy(client),
    scripts: bindScripts(client),
    pools: bindPools(client),
    dreps: bindDReps(client),
    governance: bindGovernance(client),
    transactions: bindTransactions(client),
    txBuilder: bindTxBuilder(client),
    market: {
      ...bindMarket(client),
      candles: bindPrices(client),
      dex: bindDex(client),
      nft: bindNft(client),
      wallet: bindWallet(client),
      aggregator: bindAggregator(client),
      leaderboard: bindLeaderboard(client),
      sync: bindSync(client),
      blueprints: bindBlueprints(client),
    },
  } as const;
}

export type CardanoNamespace = ReturnType<typeof makeCardano>;
