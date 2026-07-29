import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusClient } from "../src/client.js";
import { NexusUsageError } from "../src/errors.js";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => vi.restoreAllMocks());

describe("namespaced client", () => {
  const client = new NexusClient({ apiKey: "k", retryDelaysMs: [] });

  it("cardano.addresses.utxos builds the path with default pagination", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await client.cardano.addresses.utxos("addr1xyz");
    expect(String(spy.mock.calls[0]![0])).toBe(
      "https://nexus.gerowallet.io/api/addresses/addr1xyz/utxos?page=1&pageSize=100",
    );
  });

  it("cardano.pools.list and cardano.governance.proposals hit their paths", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(jsonResponse([])));
    await client.cardano.pools.list();
    await client.cardano.governance.proposals();
    const urls = spy.mock.calls.map((c) => String(c[0]));
    expect(urls[0]).toContain("/api/pools");
    expect(urls[1]).toContain("/api/governance/proposals");
  });

  it("sends the X-Api-Key header on every namespaced call", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.cardano.network.info();
    const headers = spy.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(headers["X-Api-Key"]).toBe("k");
  });

  it("bitcoin.addresses.utxos builds the btc path", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await client.bitcoin.addresses.utxos("bc1qexample");
    expect(String(spy.mock.calls[0]![0])).toContain("/api/btc/addresses/bc1qexample/utxos");
  });

  it("bitcoin.txs.hex reads a text/plain body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("deadbeef", { status: 200 }));
    const hex = await client.bitcoin.txs.hex("a".repeat(64));
    expect(hex).toBe("deadbeef");
  });

  it("midnight puts network in the path segment", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.info.get("undeployed");
    expect(String(spy.mock.calls[0]![0])).toContain("/api/midnight/undeployed/info");
  });

  it("midnight.dust.status passes the required cardanoRewardAddress query", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.dust.status("undeployed", "stake1uxyz");
    expect(String(spy.mock.calls[0]![0])).toContain("cardanoRewardAddress=stake1uxyz");
  });
});

describe("market data mainnet guard", () => {
  it("throws NexusUsageError (no request) on a non-mainnet client", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const preprod = new NexusClient({ apiKey: "k", network: "CARDANO_PREPROD", retryDelaysMs: [] });
    // Client-side precondition: fails fast and synchronously, like the missing-apiKey check.
    expect(() => preprod.cardano.market.prices()).toThrow(NexusUsageError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("allows the call on a mainnet client", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    const mainnet = new NexusClient({ apiKey: "k", network: "CARDANO_MAINNET", retryDelaysMs: [] });
    await mainnet.cardano.market.prices();
    expect(spy).toHaveBeenCalledOnce();
  });

  it("allows the call when no network is configured (server decides)", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    const anyNet = new NexusClient({ apiKey: "k", retryDelaysMs: [] });
    await anyNet.cardano.market.prices();
    expect(spy).toHaveBeenCalledOnce();
  });
});
