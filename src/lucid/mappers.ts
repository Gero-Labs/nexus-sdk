import type {
  Assets,
  Delegation,
  EvalRedeemer,
  ProtocolParameters,
  RedeemerTag,
  Script,
  UTxO,
} from "@lucid-evolution/core-types";
import type {
  NexusAccountInfo,
  NexusAddressUtxo,
  NexusOutRefUtxo,
  NexusProtocolParams,
  NexusRedeemerEval,
} from "../types.js";

function assetsFromAddressUtxo(dto: NexusAddressUtxo): Assets {
  const assets: Assets = { lovelace: BigInt(dto.value) };
  for (const asset of dto.assets ?? []) {
    assets[asset.unit] = BigInt(asset.quantity);
  }
  return assets;
}

export function toLucidScript(type: string | undefined, cborHex: string): Script {
  const normalized = (type ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.includes("v1")) return { type: "PlutusV1", script: cborHex };
  if (normalized.includes("v3")) return { type: "PlutusV3", script: cborHex };
  if (normalized.includes("native") || normalized.includes("timelock")) {
    return { type: "Native", script: cborHex };
  }
  return { type: "PlutusV2", script: cborHex };
}

export function toLucidUtxoFromAddressUtxo(dto: NexusAddressUtxo): UTxO {
  const inlineDatum = dto.inlineDatum?.bytes ?? null;
  return {
    txHash: dto.txHash,
    outputIndex: dto.txIndex,
    address: dto.address,
    assets: assetsFromAddressUtxo(dto),
    datumHash: inlineDatum ? null : (dto.datumHash ?? null),
    datum: inlineDatum,
    scriptRef: dto.referenceScript?.bytes
      ? toLucidScript(dto.referenceScript.type, dto.referenceScript.bytes)
      : null,
  };
}

export function toLucidUtxoFromOutRefUtxo(dto: NexusOutRefUtxo): UTxO {
  const assets: Assets = { lovelace: 0n };
  for (const amount of dto.amount ?? []) {
    if (amount.unit === "lovelace") assets.lovelace = BigInt(amount.quantity);
    else assets[amount.unit] = BigInt(amount.quantity);
  }
  if (assets.lovelace === 0n && dto.lovelaceAmount != null) {
    assets.lovelace = BigInt(dto.lovelaceAmount);
  }
  const inlineDatum = dto.inlineDatum ?? null;
  return {
    txHash: dto.txHash,
    outputIndex: dto.outputIndex,
    address: dto.address,
    assets,
    datumHash: inlineDatum ? null : (dto.dataHash ?? null),
    datum: inlineDatum,
    // UtxoDto carries no script type — PlutusV2 is the dominant on-chain case.
    scriptRef: dto.scriptRef ? toLucidScript(undefined, dto.scriptRef) : null,
  };
}

function costModelToArray(model: Record<string, number>): number[] {
  return Object.keys(model)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => model[key]!);
}

const COST_MODEL_KEY_PATTERN = /plutus[:_\s-]?v?(1|2|3)/i;

/** Normalize a Nexus cost-model key (`plutusV1`, `PLUTUS_V2`, `plutus:v3`, ...) to the
 * canonical lucid key, or `undefined` if it doesn't match a known Plutus version. */
function normalizeCostModelKey(key: string): "PlutusV1" | "PlutusV2" | "PlutusV3" | undefined {
  const match = COST_MODEL_KEY_PATTERN.exec(key);
  if (!match) return undefined;
  return `PlutusV${match[1]}` as "PlutusV1" | "PlutusV2" | "PlutusV3";
}

export function toLucidProtocolParameters(dto: NexusProtocolParams): ProtocolParameters {
  const costModels: Record<string, number[]> = {};
  for (const [version, model] of Object.entries(dto.costModels ?? {})) {
    const normalized = normalizeCostModelKey(version);
    if (!normalized) continue;
    costModels[normalized] = costModelToArray(model);
  }
  const requiredVersions = ["PlutusV1", "PlutusV2", "PlutusV3"] as const;
  const missing = requiredVersions.filter((version) => !(version in costModels));
  if (missing.length > 0) {
    throw new Error(`Nexus protocol params missing cost model(s): ${missing.join(", ")}`);
  }
  return {
    protocolMajorVersion: dto.protocolMajorVer,
    protocolMinorVersion: dto.protocolMinorVer,
    minFeeA: dto.minFeeA,
    minFeeB: dto.minFeeB,
    maxTxSize: dto.maxTxSize,
    maxValSize: Number(dto.maxValSize),
    keyDeposit: BigInt(dto.keyDeposit),
    poolDeposit: BigInt(dto.poolDeposit),
    drepDeposit: BigInt(dto.drepDeposit ?? 0),
    govActionDeposit: BigInt(dto.govActionDeposit ?? 0),
    priceMem: dto.priceMem,
    priceStep: dto.priceStep,
    maxTxExMem: BigInt(dto.maxTxExMem),
    maxTxExSteps: BigInt(dto.maxTxExSteps),
    coinsPerUtxoByte: BigInt(dto.coinsPerUtxoSize),
    collateralPercentage: dto.collateralPercent,
    maxCollateralInputs: dto.maxCollateralInputs,
    minFeeRefScriptCostPerByte: dto.minFeeRefScriptCostPerByte ?? 0,
    costModels: costModels as ProtocolParameters["costModels"],
  };
}

export function toLucidDelegation(dto: NexusAccountInfo): Delegation {
  return {
    poolId: dto.poolId ?? null,
    rewards: BigInt(dto.withdrawableAmount ?? 0),
  };
}

const REDEEMER_TAGS: Record<string, RedeemerTag> = {
  spend: "spend",
  mint: "mint",
  publish: "publish",
  certificate: "publish",
  cert: "publish",
  withdraw: "withdraw",
  withdrawal: "withdraw",
  reward: "withdraw",
  vote: "vote",
  voting: "vote",
  propose: "propose",
  proposing: "propose",
};

export function toLucidEvalRedeemers(dtos: NexusRedeemerEval[]): EvalRedeemer[] {
  return dtos.map((dto) => {
    const tag = REDEEMER_TAGS[dto.redeemerTag.toLowerCase()];
    if (!tag) throw new Error(`Unknown redeemer tag from Nexus: ${dto.redeemerTag}`);
    return {
      redeemer_tag: tag,
      redeemer_index: dto.index,
      ex_units: { mem: dto.exUnits.mem, steps: dto.exUnits.steps },
    };
  });
}

/**
 * Ogmios v6 requires numeric (not bigint) quantities in JSON payloads. Downscale safely,
 * falling back to a numeric string only if the value exceeds Number.MAX_SAFE_INTEGER
 * (lovelace supply never does, but native token quantities are unbounded).
 */
function ogmiosSafeNumber(quantity: bigint): number | string {
  return quantity <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(quantity) : quantity.toString();
}

/** Convert lucid UTxOs to Ogmios v6 `additionalUtxo` entries (passed through by Nexus). */
export function toOgmiosAdditionalUtxo(utxos: UTxO[]): unknown[] {
  return utxos.map((utxo) => {
    const value: Record<string, Record<string, number | string>> = {
      ada: { lovelace: ogmiosSafeNumber(utxo.assets.lovelace ?? 0n) },
    };
    for (const [unit, quantity] of Object.entries(utxo.assets)) {
      if (unit === "lovelace") continue;
      const policyId = unit.slice(0, 56);
      const assetName = unit.slice(56);
      (value[policyId] ??= {})[assetName] = ogmiosSafeNumber(quantity);
    }
    const entry: Record<string, unknown> = {
      transaction: { id: utxo.txHash },
      index: utxo.outputIndex,
      address: utxo.address,
      value,
    };
    if (utxo.datumHash) entry.datumHash = utxo.datumHash;
    if (utxo.datum) entry.datum = utxo.datum;
    if (utxo.scriptRef) {
      entry.script = {
        language:
          utxo.scriptRef.type === "Native"
            ? "native"
            : utxo.scriptRef.type.toLowerCase().replace("plutusv", "plutus:v"),
        cbor: utxo.scriptRef.script,
      };
    }
    return entry;
  });
}
