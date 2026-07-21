import { describe, expect, it } from "vitest";
import {
  toLucidDelegation,
  toLucidEvalRedeemers,
  toLucidProtocolParameters,
  toLucidScript,
  toLucidUtxoFromAddressUtxo,
  toLucidUtxoFromOutRefUtxo,
  toOgmiosAdditionalUtxo,
} from "../src/lucid/mappers.js";
import type { NexusAddressUtxo, NexusOutRefUtxo, NexusProtocolParams } from "../src/types.js";

const addressUtxo: NexusAddressUtxo = {
  txHash: "a".repeat(64),
  txIndex: 1,
  address: "addr_test1qz",
  value: "2000000",
  assets: [
    { unit: "b".repeat(56) + "474552", quantity: "5", policyId: "b".repeat(56), assetName: "474552" },
  ],
  datumHash: "c".repeat(64),
};

describe("toLucidUtxoFromAddressUtxo", () => {
  it("maps outref, lovelace, native assets, datumHash", () => {
    const utxo = toLucidUtxoFromAddressUtxo(addressUtxo);
    expect(utxo).toEqual({
      txHash: "a".repeat(64),
      outputIndex: 1,
      address: "addr_test1qz",
      assets: { lovelace: 2000000n, ["b".repeat(56) + "474552"]: 5n },
      datumHash: "c".repeat(64),
      datum: null,
      scriptRef: null,
    });
  });

  it("prefers inline datum bytes and maps reference script", () => {
    const utxo = toLucidUtxoFromAddressUtxo({
      ...addressUtxo,
      datumHash: undefined,
      inlineDatum: { bytes: "d87980" },
      referenceScript: { type: "plutusV2", bytes: "490100" },
    });
    expect(utxo.datum).toBe("d87980");
    expect(utxo.datumHash).toBeNull();
    expect(utxo.scriptRef).toEqual({ type: "PlutusV2", script: "490100" });
  });
});

describe("toLucidUtxoFromOutRefUtxo", () => {
  it("maps the transaction-model UTxO shape", () => {
    const dto: NexusOutRefUtxo = {
      txHash: "e".repeat(64),
      outputIndex: 0,
      address: "addr_test1qq",
      amount: [
        { unit: "lovelace", quantity: "1500000" },
        { unit: "f".repeat(56) + "41", quantity: "2" },
      ],
      dataHash: "1".repeat(64),
      inlineDatum: "d87980",
      scriptRef: "490100",
    };
    const utxo = toLucidUtxoFromOutRefUtxo(dto);
    expect(utxo.assets).toEqual({ lovelace: 1500000n, ["f".repeat(56) + "41"]: 2n });
    expect(utxo.datum).toBe("d87980");
    // scriptRef type is unknown in this DTO — mapper defaults to PlutusV2 CBOR wrapper.
    expect(utxo.scriptRef).toEqual({ type: "PlutusV2", script: "490100" });
  });
});

describe("toLucidProtocolParameters", () => {
  it("maps the flat Nexus params to lucid ProtocolParameters", () => {
    const dto: NexusProtocolParams = {
      minFeeA: 44,
      minFeeB: 155381,
      maxTxSize: 16384,
      maxValSize: "5000",
      keyDeposit: "2000000",
      poolDeposit: "500000000",
      drepDeposit: "500000000",
      govActionDeposit: "100000000000",
      priceMem: 0.0577,
      priceStep: 0.0000721,
      maxTxExMem: "14000000",
      maxTxExSteps: "10000000000",
      coinsPerUtxoSize: "4310",
      collateralPercent: 150,
      maxCollateralInputs: 3,
      minFeeRefScriptCostPerByte: 15,
      costModels: { PlutusV1: { "0": 100, "1": 200 }, PlutusV2: { "0": 1 }, PlutusV3: { "0": 2 } },
    };
    const params = toLucidProtocolParameters(dto);
    expect(params.minFeeA).toBe(44);
    expect(params.keyDeposit).toBe(2000000n);
    expect(params.maxTxExMem).toBe(14000000n);
    expect(params.coinsPerUtxoByte).toBe(4310n);
    expect(params.collateralPercentage).toBe(150);
    expect(params.costModels.PlutusV1).toEqual([100, 200]);
  });
});

describe("toLucidDelegation", () => {
  it("maps poolId and withdrawable rewards", () => {
    expect(
      toLucidDelegation({ poolId: "pool1abc", withdrawableAmount: "123" }),
    ).toEqual({ poolId: "pool1abc", rewards: 123n });
  });
  it("handles undelegated accounts", () => {
    expect(toLucidDelegation({})).toEqual({ poolId: null, rewards: 0n });
  });
});

describe("toLucidEvalRedeemers", () => {
  it("maps tags and exunits", () => {
    expect(
      toLucidEvalRedeemers([
        { redeemerTag: "SPEND", index: 0, exUnits: { mem: 10, steps: 100 } },
        { redeemerTag: "certificate", index: 1, exUnits: { mem: 1, steps: 2 } },
      ]),
    ).toEqual([
      { redeemer_tag: "spend", redeemer_index: 0, ex_units: { mem: 10, steps: 100 } },
      { redeemer_tag: "publish", redeemer_index: 1, ex_units: { mem: 1, steps: 2 } },
    ]);
  });
});

describe("toLucidScript", () => {
  it.each([
    ["plutusV1", "PlutusV1"],
    ["PLUTUS_V2", "PlutusV2"],
    ["plutus:v3", "PlutusV3"],
    ["native", "Native"],
    ["timelock", "Native"],
  ])("normalizes %s -> %s", (input, expected) => {
    expect(toLucidScript(input, "aa").type).toBe(expected);
  });
});

describe("toOgmiosAdditionalUtxo", () => {
  it("converts lucid UTxOs to Ogmios v6 additionalUtxo entries", () => {
    const entries = toOgmiosAdditionalUtxo([
      {
        txHash: "a".repeat(64),
        outputIndex: 2,
        address: "addr_test1qz",
        assets: { lovelace: 5000000n, ["b".repeat(56) + "474552"]: 7n },
        datum: "d87980",
      },
    ]);
    expect(entries).toEqual([
      {
        transaction: { id: "a".repeat(64) },
        index: 2,
        address: "addr_test1qz",
        value: { ada: { lovelace: 5000000 }, ["b".repeat(56)]: { "474552": 7 } },
        datum: "d87980",
      },
    ]);
  });
});
