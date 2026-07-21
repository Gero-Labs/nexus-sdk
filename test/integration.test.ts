import { describe, expect, it } from "vitest";
import { NexusProvider } from "../src/lucid/provider.js";

const apiKey = process.env.NEXUS_API_KEY;
const address = process.env.NEXUS_TEST_ADDRESS;
const stakeAddress = process.env.NEXUS_TEST_STAKE_ADDRESS;

describe.skipIf(!apiKey)("integration (preprod)", () => {
  it("fetches protocol parameters", async () => {
    const provider = new NexusProvider({
      apiKey: apiKey!,
      network: "Preprod",
      baseUrl: process.env.NEXUS_BASE_URL,
    });
    const params = await provider.getProtocolParameters();
    expect(params.minFeeA).toBeGreaterThan(0);
    expect(params.keyDeposit).toBeGreaterThan(0n);
    expect(Object.keys(params.costModels)).toContain("PlutusV2");
  });

  it.skipIf(!address)("fetches utxos for the test address", async () => {
    const provider = new NexusProvider({
      apiKey: apiKey!,
      network: "Preprod",
      baseUrl: process.env.NEXUS_BASE_URL,
    });
    const utxos = await provider.getUtxos(address!);
    expect(Array.isArray(utxos)).toBe(true);
    for (const utxo of utxos) {
      expect(typeof utxo.assets.lovelace).toBe("bigint");
      expect(utxo.txHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it.skipIf(!stakeAddress)("fetches delegation", async () => {
    const provider = new NexusProvider({
      apiKey: apiKey!,
      network: "Preprod",
      baseUrl: process.env.NEXUS_BASE_URL,
    });
    const delegation = await provider.getDelegation(stakeAddress!);
    expect(typeof delegation.rewards).toBe("bigint");
  });
}, 60_000);
