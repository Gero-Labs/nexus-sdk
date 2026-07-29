import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusClient } from "../src/client.js";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const BASE = "https://nexus.gerowallet.io";
const client = new NexusClient({ apiKey: "k", retryDelaysMs: [] });

afterEach(() => vi.restoreAllMocks());

describe("bitcoin.addresses", () => {
  it("get() hits /api/btc/addresses/{address}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.addresses.get("bc1qexample");
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/addresses/bc1qexample`);
  });

  it("balance() hits /api/btc/addresses/{address}/balance", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.addresses.balance("bc1qexample");
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/btc/addresses/bc1qexample/balance`,
    );
  });

  it("utxos() hits /api/btc/addresses/{address}/utxos", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await client.bitcoin.addresses.utxos("bc1qexample");
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/btc/addresses/bc1qexample/utxos`,
    );
  });

  it("ordinals() hits /api/btc/addresses/{address}/ordinals", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.addresses.ordinals("bc1qexample");
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/btc/addresses/bc1qexample/ordinals`,
    );
  });

  it("url-encodes the address path segment", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.addresses.get("a/b");
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/addresses/a%2Fb`);
  });
});

describe("bitcoin.txs", () => {
  const txid = "a".repeat(64);

  it("byId() hits /api/btc/txs/{txid}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.txs.byId(txid);
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/txs/${txid}`);
  });

  it("byId() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.bitcoin.txs.byId(txid)).toBeNull();
  });

  it("hex() reads a text/plain body and returns the string", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("deadbeef", { status: 200 }));
    const hex = await client.bitcoin.txs.hex(txid);
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/txs/${txid}/hex`);
    expect(hex).toBe("deadbeef");
  });

  it("hex() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.bitcoin.txs.hex(txid)).toBeNull();
  });

  it("submit() POSTs the body to /api/btc/txs/submit", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ txid }));
    const body = { txHex: "deadbeef" } as never;
    await client.bitcoin.txs.submit(body);
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/txs/submit`);
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({ txHex: "deadbeef" });
  });
});

describe("bitcoin.blocks", () => {
  it("recent() hits /api/btc/blocks with no query by default", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await client.bitcoin.blocks.recent();
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/blocks`);
  });

  it("recent({ limit }) passes the limit query param", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await client.bitcoin.blocks.recent({ limit: 5 });
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/blocks?limit=5`);
  });

  it("byIdOrHeight() hits /api/btc/blocks/{idOrHeight} (string hash)", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.blocks.byIdOrHeight("000abc");
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/blocks/000abc`);
  });

  it("byIdOrHeight() stringifies a numeric height", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.blocks.byIdOrHeight(840000);
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/blocks/840000`);
  });

  it("byIdOrHeight() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.bitcoin.blocks.byIdOrHeight("nope")).toBeNull();
  });
});

describe("bitcoin.fees", () => {
  it("estimates() hits /api/btc/fees", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.fees.estimates();
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/fees`);
  });
});

describe("bitcoin.mempool", () => {
  it("snapshot() hits /api/btc/mempool", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.mempool.snapshot();
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/mempool`);
  });
});

describe("bitcoin.chain", () => {
  it("tip() hits /api/btc/chain/tip", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.chain.tip();
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/chain/tip`);
  });

  it("latestBlock() hits /api/btc/chain/latest-block", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.chain.latestBlock();
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/btc/chain/latest-block`);
  });
});

describe("bitcoin.ordinals", () => {
  it("inscription() hits /api/btc/ordinals/inscriptions/{id}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.ordinals.inscription("insc123");
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/btc/ordinals/inscriptions/insc123`,
    );
  });

  it("inscription() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.bitcoin.ordinals.inscription("insc123")).toBeNull();
  });

  it("output() hits /api/btc/ordinals/outputs/{outpoint}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.ordinals.output("txid:0");
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/btc/ordinals/outputs/txid%3A0`,
    );
  });

  it("output() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.bitcoin.ordinals.output("txid:0")).toBeNull();
  });

  it("rune() hits /api/btc/ordinals/runes/{rune}", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.bitcoin.ordinals.rune("UNCOMMON•GOODS");
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/btc/ordinals/runes/${encodeURIComponent("UNCOMMON•GOODS")}`,
    );
  });

  it("rune() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.bitcoin.ordinals.rune("840000:1")).toBeNull();
  });
});
