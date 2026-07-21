import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusProvider } from "../src/lucid/provider.js";
import type { NexusAddressUtxo } from "../src/types.js";

const provider = new NexusProvider({ apiKey: "k", network: "Preprod" });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const utxoDto = (index: number): NexusAddressUtxo => ({
  txHash: "a".repeat(64),
  txIndex: index,
  address: "addr_test1qz",
  value: "1000000",
});

afterEach(() => vi.restoreAllMocks());

describe("NexusProvider", () => {
  it("maps lucid network to Nexus network param", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await provider.getUtxos("addr_test1qz");
    expect(String(spy.mock.calls[0]![0])).toContain("network=CARDANO_PREPROD");
  });

  it("getUtxos paginates until a short page", async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => utxoDto(i));
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(fullPage))
      .mockResolvedValueOnce(jsonResponse([utxoDto(100)]));
    const utxos = await provider.getUtxos("addr_test1qz");
    expect(utxos).toHaveLength(101);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(String(spy.mock.calls[1]![0])).toContain("page=2");
  });

  it("getUtxos stops after a batch that isn't exactly pageSize, even if larger", async () => {
    // A misbehaving/self-hosted server that ignores pageSize and returns MORE than
    // PAGE_SIZE items must not cause an infinite loop or duplicate accumulation.
    const oversizedPage = Array.from({ length: 150 }, (_, i) => utxoDto(i));
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(oversizedPage));
    const utxos = await provider.getUtxos("addr_test1qz");
    expect(utxos).toHaveLength(150);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("getUtxos accepts a Credential and uses the cred endpoint", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await provider.getUtxos({ type: "Key", hash: "ab".repeat(28) });
    expect(String(spy.mock.calls[0]![0])).toContain(`/api/addresses/cred/${"ab".repeat(28)}/utxos`);
  });

  it("getUtxoByUnit throws when zero or multiple", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await expect(provider.getUtxoByUnit("b".repeat(56) + "41")).rejects.toThrow(/not found/i);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([utxoDto(0), utxoDto(1)]),
    );
    await expect(provider.getUtxoByUnit("b".repeat(56) + "41")).rejects.toThrow(/more than one/i);
  });

  it("getUtxoByUnit requests a wide page and filters out spent entries", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([
        { ...utxoDto(0), spent: true },
        utxoDto(1),
      ]),
    );
    const utxo = await provider.getUtxoByUnit("b".repeat(56) + "41");
    expect(utxo.outputIndex).toBe(1);
    expect(String(spy.mock.calls[0]![0])).toContain("pageSize=100");
  });

  it("getDatum returns datum cbor", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ hash: "c".repeat(64), cbor: "d87980" }),
    );
    expect(await provider.getDatum("c".repeat(64))).toBe("d87980");
  });

  it("awaitTx polls until found", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404))
      .mockResolvedValueOnce(jsonResponse({ hash: "a".repeat(64) }));
    const found = await provider.awaitTx("a".repeat(64), 10);
    expect(found).toBe(true);
  });

  it("awaitTx rejects on non-404 errors instead of polling forever", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Invalid API key" }, 401),
    );
    await expect(provider.awaitTx("a".repeat(64), 10)).rejects.toMatchObject({ status: 401 });
  });

  it("submitTx posts hex and returns hash", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ff".repeat(32)));
    expect(await provider.submitTx("84a400")).toBe("ff".repeat(32));
  });

  it("evaluateTx converts additional utxos to ogmios format", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await provider.evaluateTx("84a400", [
      {
        txHash: "a".repeat(64),
        outputIndex: 0,
        address: "addr_test1qz",
        assets: { lovelace: 1n },
      },
    ]);
    const body = JSON.parse(spy.mock.calls[0]![1]!.body as string);
    expect(body.cbor).toBe("84a400");
    expect(body.additionalUtxoSet[0].transaction.id).toBe("a".repeat(64));
  });
});
