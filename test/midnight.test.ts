import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusClient } from "../src/client.js";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const BASE = "https://nexus.gerowallet.io";
const NET = "undeployed";
const client = new NexusClient({ apiKey: "k", retryDelaysMs: [] });

afterEach(() => vi.restoreAllMocks());

describe("midnight.info", () => {
  it("get(network) puts the network in the path", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.info.get(NET);
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/midnight/${NET}/info`);
  });

  it("url-encodes the network segment", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.info.get("dev net");
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/midnight/dev%20net/info`);
  });
});

describe("midnight.tx", () => {
  const txHash = "b".repeat(64);

  it("utxos() hits /transactions/{txHash}/utxos with network in path", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.tx.utxos(NET, txHash);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/transactions/${txHash}/utxos`,
    );
  });

  it("utxos() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.midnight.tx.utxos(NET, txHash)).toBeNull();
  });

  it("buildUnshielded() POSTs to /tx/build-unshielded", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { to: "addr", amount: "10" } as never;
    await client.midnight.tx.buildUnshielded(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/tx/build-unshielded`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({
      to: "addr",
      amount: "10",
    });
  });

  it("submit() POSTs to /tx/submit", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { signedTxHex: "abcd" } as never;
    await client.midnight.tx.submit(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(`${BASE}/api/midnight/${NET}/tx/submit`);
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({ signedTxHex: "abcd" });
  });

  it("submitProven() POSTs to /tx/submit-proven", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { provenTxHex: "ef01" } as never;
    await client.midnight.tx.submitProven(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/tx/submit-proven`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({ provenTxHex: "ef01" });
  });

  it("proveAndSubmit() POSTs to /tx/prove-and-submit", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { unprovenTxHex: "2345" } as never;
    await client.midnight.tx.proveAndSubmit(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/tx/prove-and-submit`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({ unprovenTxHex: "2345" });
  });
});

describe("midnight.dust", () => {
  const reward = "stake1uxyz";

  it("accountState() hits /dust/account-state/{address} with network in path", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.dust.accountState(NET, "mdnt1addr");
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/dust/account-state/mdnt1addr`,
    );
  });

  it("accountState() returns null on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "x" }, 404));
    expect(await client.midnight.dust.accountState(NET, "mdnt1addr")).toBeNull();
  });

  it("status() passes cardanoRewardAddress query", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.dust.status(NET, reward);
    const url = String(spy.mock.calls[0]![0]);
    expect(url).toContain(`/api/midnight/${NET}/dust/status`);
    expect(url).toContain(`cardanoRewardAddress=${reward}`);
  });

  it("registrations() passes cardanoRewardAddress query", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await client.midnight.dust.registrations(NET, reward);
    const url = String(spy.mock.calls[0]![0]);
    expect(url).toContain(`/api/midnight/${NET}/dust/registrations`);
    expect(url).toContain(`cardanoRewardAddress=${reward}`);
  });

  it("stateSnapshot() passes registeredAt query", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    await client.midnight.dust.stateSnapshot(NET, "2026-01-01T00:00:00Z");
    const url = String(spy.mock.calls[0]![0]);
    expect(url).toContain(`/api/midnight/${NET}/dust/state-snapshot`);
    expect(url).toContain(`registeredAt=${encodeURIComponent("2026-01-01T00:00:00Z")}`);
  });

  it("statusBatch() POSTs to /dust/status/batch", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    const body = { addresses: [reward] } as never;
    await client.midnight.dust.statusBatch(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/dust/status/batch`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({ addresses: [reward] });
  });

  it("buildRegistrationTx() POSTs to /dust/build-registration-tx", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { cardanoRewardAddress: reward } as never;
    await client.midnight.dust.buildRegistrationTx(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/dust/build-registration-tx`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({
      cardanoRewardAddress: reward,
    });
  });

  it("buildDeregistrationTx() POSTs to /dust/build-deregistration-tx", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { cardanoRewardAddress: reward } as never;
    await client.midnight.dust.buildDeregistrationTx(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/dust/build-deregistration-tx`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({
      cardanoRewardAddress: reward,
    });
  });

  it("buildUpdateTx() POSTs to /dust/build-update-tx", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { cardanoRewardAddress: reward } as never;
    await client.midnight.dust.buildUpdateTx(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/dust/build-update-tx`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({
      cardanoRewardAddress: reward,
    });
  });

  it("buildNightRegistration() POSTs to /dust/build-night-registration", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { address: "mdnt1addr" } as never;
    await client.midnight.dust.buildNightRegistration(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/dust/build-night-registration`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({ address: "mdnt1addr" });
  });

  it("submitNightRegistration() POSTs to /dust/submit-night-registration", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { signedTxHex: "abcd" } as never;
    await client.midnight.dust.submitNightRegistration(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/dust/submit-night-registration`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({ signedTxHex: "abcd" });
  });
});

describe("midnight.indexer", () => {
  it("graphql() POSTs to /indexer/graphql with network in path", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const body = { query: "{ block { height } }" } as never;
    await client.midnight.indexer.graphql(NET, body);
    expect(String(spy.mock.calls[0]![0])).toBe(
      `${BASE}/api/midnight/${NET}/indexer/graphql`,
    );
    expect(spy.mock.calls[0]![1]!.method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toEqual({
      query: "{ block { height } }",
    });
  });
});
