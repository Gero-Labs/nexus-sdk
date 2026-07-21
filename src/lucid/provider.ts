import type {
  Address,
  Credential,
  Datum,
  DatumHash,
  Delegation,
  EvalRedeemer,
  OutRef,
  ProtocolParameters,
  Provider,
  RewardAddress,
  Transaction,
  TxHash,
  Unit,
  UTxO,
} from "@lucid-evolution/core-types";
import { NexusClient, type NexusNetwork } from "../client.js";
import { getAccountInfo } from "../endpoints/account.js";
import {
  getAddressUtxos,
  getAddressUtxosWithAsset,
  getCredentialUtxos,
} from "../endpoints/addresses.js";
import { getAssetUtxos } from "../endpoints/assets.js";
import { getProtocolParams } from "../endpoints/epoch.js";
import { getDatum } from "../endpoints/scripts.js";
import {
  evaluateTx,
  getTransaction,
  getUtxosByOutRefs,
  submitTx,
} from "../endpoints/transactions.js";
import type { NexusAddressUtxo } from "../types.js";
import {
  toLucidDelegation,
  toLucidEvalRedeemers,
  toLucidProtocolParameters,
  toLucidUtxoFromAddressUtxo,
  toLucidUtxoFromOutRefUtxo,
  toOgmiosAdditionalUtxo,
} from "./mappers.js";

export type LucidNetwork = "Mainnet" | "Preprod" | "Preview";

export interface NexusProviderOptions {
  apiKey: string;
  network: LucidNetwork;
  baseUrl?: string;
  timeoutMs?: number;
}

const NETWORK_MAP: Record<LucidNetwork, NexusNetwork> = {
  Mainnet: "MAINNET",
  Preprod: "PREPROD",
  Preview: "PREVIEW",
};

const PAGE_SIZE = 100;

export class NexusProvider implements Provider {
  readonly client: NexusClient;

  constructor(options: NexusProviderOptions) {
    this.client = new NexusClient({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      network: NETWORK_MAP[options.network],
      timeoutMs: options.timeoutMs,
    });
  }

  private async paginate(
    fetchPage: (page: number) => Promise<NexusAddressUtxo[]>,
  ): Promise<UTxO[]> {
    const all: NexusAddressUtxo[] = [];
    for (let page = 1; ; page++) {
      const batch = await fetchPage(page);
      all.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return all.map(toLucidUtxoFromAddressUtxo);
  }

  async getProtocolParameters(): Promise<ProtocolParameters> {
    return toLucidProtocolParameters(await getProtocolParams(this.client));
  }

  async getUtxos(addressOrCredential: Address | Credential): Promise<UTxO[]> {
    if (typeof addressOrCredential === "string") {
      return this.paginate((page) =>
        getAddressUtxos(this.client, addressOrCredential, page, PAGE_SIZE),
      );
    }
    return this.paginate((page) =>
      getCredentialUtxos(this.client, addressOrCredential.hash, page, PAGE_SIZE),
    );
  }

  async getUtxosWithUnit(
    addressOrCredential: Address | Credential,
    unit: Unit,
  ): Promise<UTxO[]> {
    if (typeof addressOrCredential === "string") {
      return this.paginate((page) =>
        getAddressUtxosWithAsset(this.client, addressOrCredential, unit, page, PAGE_SIZE),
      );
    }
    // Nexus has no credential+asset endpoint; filter the credential's utxos client-side.
    const utxos = await this.getUtxos(addressOrCredential);
    return utxos.filter((utxo) => utxo.assets[unit] !== undefined);
  }

  async getUtxoByUnit(unit: Unit): Promise<UTxO> {
    // The primary (YACI) backend already returns unspent-only UTxOs (SQL UNSPENT_PREDICATE),
    // but fallback providers aren't guaranteed to honor that. The `spent !== true` filter plus
    // this wide page size guard against a fallback provider returning spent entries mixed in.
    const dtos = await getAssetUtxos(this.client, unit, 1, 100);
    const unspent = dtos.filter((dto) => dto.spent !== true);
    if (unspent.length === 0) throw new Error(`UTxO with unit ${unit} not found`);
    if (unspent.length > 1) throw new Error(`Unit ${unit} is held in more than one UTxO`);
    return toLucidUtxoFromAddressUtxo(unspent[0]!);
  }

  async getUtxosByOutRef(outRefs: OutRef[]): Promise<UTxO[]> {
    const dtos = await getUtxosByOutRefs(
      this.client,
      outRefs.map((ref) => ({ txHash: ref.txHash, outputIndex: ref.outputIndex })),
    );
    return dtos.map(toLucidUtxoFromOutRefUtxo);
  }

  async getDelegation(rewardAddress: RewardAddress): Promise<Delegation> {
    return toLucidDelegation(await getAccountInfo(this.client, rewardAddress));
  }

  async getDatum(datumHash: DatumHash): Promise<Datum> {
    const datum = await getDatum(this.client, datumHash);
    if (!datum.cbor) throw new Error(`Datum ${datumHash} not found`);
    return datum.cbor;
  }

  async awaitTx(txHash: TxHash, checkInterval = 3000): Promise<boolean> {
    for (;;) {
      // getTransaction maps 404 -> null; any other error (auth, 5xx, network) must propagate.
      const tx = await getTransaction(this.client, txHash);
      if (tx !== null) return true;
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
  }

  async submitTx(tx: Transaction): Promise<TxHash> {
    return submitTx(this.client, tx);
  }

  async evaluateTx(tx: Transaction, additionalUTxOs?: UTxO[]): Promise<EvalRedeemer[]> {
    const additional = additionalUTxOs?.length
      ? toOgmiosAdditionalUtxo(additionalUTxOs)
      : undefined;
    return toLucidEvalRedeemers(await evaluateTx(this.client, tx, additional));
  }
}
