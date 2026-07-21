export interface NexusAssetBalance {
  unit: string;
  policyId?: string;
  assetName?: string;
  fingerprint?: string;
  quantity: string;
  decimals?: number;
  hasOnchainMetadata?: boolean;
}

export interface NexusInlineDatum {
  bytes?: string;
  value?: unknown;
}

export interface NexusReferenceScript {
  hash?: string;
  size?: number;
  type?: string;
  bytes?: string;
  value?: unknown;
}

/** Shape of GET /api/addresses/.../utxos and /api/assets/{unit}/utxos entries. */
export interface NexusAddressUtxo {
  txHash: string;
  txIndex: number;
  address: string;
  stakeAddress?: string;
  paymentCred?: string;
  /** Lovelace amount as string. */
  value: string;
  datumHash?: string;
  inlineDatum?: NexusInlineDatum;
  referenceScript?: NexusReferenceScript;
  assets?: NexusAssetBalance[];
  spent?: boolean;
  slot?: number;
  blockHash?: string;
  blockHeight?: number;
  blockTime?: number;
  epoch?: number;
  cborHex?: string;
}

export interface NexusAmount {
  unit: string;
  quantity: string;
  policyId?: string;
  assetName?: string;
}

/** Shape of POST /api/transactions/utxos entries (different DTO from NexusAddressUtxo). */
/**
 * Shape of POST /api/transactions/utxos entries. Unlike the address-utxo
 * endpoints, this DTO serializes snake_case on the wire (@JsonProperty in
 * the backend's UtxoDto) — wire-verified against preprod.
 */
export interface NexusOutRefAmount {
  unit: string;
  quantity: string;
  policy_id?: string | null;
  asset_name?: string | null;
}

export interface NexusOutRefUtxo {
  tx_hash: string;
  output_index: number;
  owner_addr: string;
  owner_stake_addr?: string | null;
  owner_payment_credential?: string | null;
  owner_stake_credential?: string | null;
  amounts?: NexusOutRefAmount[] | null;
  lovelace_amount?: number | null;
  data_hash?: string | null;
  /** Inline datum CBOR hex. */
  inline_datum?: string | null;
  inline_datum_json?: Record<string, unknown> | null;
  reference_script_hash?: string | null;
  /** Reference script CBOR hex. */
  script_ref?: string | null;
  collateral?: boolean | null;
  reference?: boolean | null;
  consumed_by_tx?: string | null;
  is_collateral_return?: boolean | null;
  block_number?: number | null;
  block_time?: number | null;
  block_hash?: string | null;
  slot?: number | null;
  epoch?: number | null;
}

export interface NexusOutRefRequest {
  txHash: string;
  outputIndex: number;
}

export interface NexusProtocolParams {
  minFeeA: number;
  minFeeB: number;
  maxTxSize: number;
  maxValSize: string;
  keyDeposit: string;
  poolDeposit: string;
  drepDeposit?: string | number;
  govActionDeposit?: string | number;
  priceMem: number;
  priceStep: number;
  maxTxExMem: string;
  maxTxExSteps: string;
  coinsPerUtxoSize: string;
  collateralPercent: number;
  maxCollateralInputs: number;
  minFeeRefScriptCostPerByte?: number;
  protocolMajorVer?: number;
  protocolMinorVer?: number;
  costModels: Record<string, Record<string, number>>;
}

export interface NexusAccountInfo {
  stakeAddress?: string;
  active?: boolean;
  poolId?: string;
  drepId?: string;
  withdrawableAmount?: string;
  controlledAmount?: string;
}

export interface NexusDatum {
  hash?: string;
  cbor?: string;
  json?: unknown;
}

export interface NexusScriptDetail {
  hash?: string;
  type?: string;
  cbor?: string;
  size?: number;
  json?: unknown;
}

export interface NexusExUnits {
  mem: number;
  steps: number;
}

export interface NexusRedeemerEval {
  redeemerTag: string;
  index: number;
  exUnits: NexusExUnits;
}
