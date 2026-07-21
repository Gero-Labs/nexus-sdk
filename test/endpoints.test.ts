import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusClient } from "../src/client.js";
import {
  getAddressUtxos,
  getAddressUtxosWithAsset,
  getCredentialUtxos,
} from "../src/endpoints/addresses.js";
import { getAssetUtxos } from "../src/endpoints/assets.js";
import { getAccountInfo } from "../src/endpoints/account.js";
import { getProtocolParams } from "../src/endpoints/epoch.js";
import { getDatum, getScript } from "../src/endpoints/scripts.js";
import {
  evaluateTx,
  getTransaction,
  getUtxosByOutRefs,
  submitTx,
} from "../src/endpoints/transactions.js";

const client = new NexusClient({ apiKey: "k", retryDelaysMs: [] });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => vi.restoreAllMocks());

describe("endpoints", () => {
  it("getAddressUtxos hits the right path with pagination", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await getAddressUtxos(client, "addr1xyz", 2, 100);
    expect(String(spy.mock.calls[0]![0])).toBe(
      "https://nexus.gerowallet.io/api/addresses/addr1xyz/utxos?page=2&pageSize=100",
    );
  });

  it("getCredentialUtxos / getAddressUtxosWithAsset / getAssetUtxos paths", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(jsonResponse([])));
    await getCredentialUtxos(client, "abcd01", 1, 100);
    await getAddressUtxosWithAsset(client, "addr1xyz", "policy0aabb", 1, 100);
    await getAssetUtxos(client, "policy0aabb", 1, 100);
    const urls = spy.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain("/api/addresses/cred/abcd01/utxos?");
    expect(urls[1]).toContain("/api/addresses/addr1xyz/utxos/policy0aabb?");
    expect(urls[2]).toContain("/api/assets/policy0aabb/utxos?");
  });

  it("getUtxosByOutRefs chunks requests of >100 into batches", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(jsonResponse([{ txHash: "aa", outputIndex: 0, address: "addr1" }])));
    const refs = Array.from({ length: 150 }, (_, i) => ({
      txHash: "t".repeat(64),
      outputIndex: i,
    }));
    const out = await getUtxosByOutRefs(client, refs);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toHaveLength(100);
    expect(JSON.parse(spy.mock.calls[1]![1]!.body as string)).toHaveLength(50);
    expect(out).toHaveLength(2);
  });

  it("getAccountInfo / getProtocolParams / getDatum / getScript paths", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(jsonResponse({})));
    await getAccountInfo(client, "stake1uxyz");
    await getProtocolParams(client);
    await getDatum(client, "d".repeat(64));
    await getScript(client, "5".repeat(56));
    const urls = spy.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain("/api/account/stake1uxyz/info");
    expect(urls[1]).toContain("/api/epoch/params");
    expect(urls[2]).toContain(`/api/scripts/datum/${"d".repeat(64)}`);
    expect(urls[3]).toContain(`/api/scripts/${"5".repeat(56)}`);
  });

  it("submitTx posts raw hex text and returns the hash", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("deadbeef", { status: 200 }));
    const hash = await submitTx(client, "84a400");
    expect(hash).toBe("deadbeef");
    expect(spy.mock.calls[0]![1]!.body).toBe("84a400");
  });

  it("evaluateTx posts {cbor, additionalUtxoSet}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await evaluateTx(client, "84a400", [{ transaction: { id: "aa" }, index: 0 }]);
    const body = JSON.parse(spy.mock.calls[0]![1]!.body as string);
    expect(body).toEqual({
      cbor: "84a400",
      additionalUtxoSet: [{ transaction: { id: "aa" }, index: 0 }],
    });
  });

  it("getTransaction returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "not found" }, 404),
    );
    expect(await getTransaction(client, "a".repeat(64))).toBeNull();
  });
});
