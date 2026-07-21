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
export interface NexusOutRefUtxo {
  txHash: string;
  outputIndex: number;
  address: string;
  amount?: NexusAmount[];
  lovelaceAmount?: number;
  dataHash?: string;
  /** Inline datum CBOR hex. */
  inlineDatum?: string;
  inlineDatumJson?: Record<string, unknown>;
  referenceScriptHash?: string;
  /** Reference script CBOR hex. */
  scriptRef?: string;
  collateral?: boolean;
  reference?: boolean;
  consumedByTx?: string;
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
