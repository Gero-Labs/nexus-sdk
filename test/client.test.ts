import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusClient } from "../src/client.js";
import { NexusApiError } from "../src/errors.js";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("NexusClient", () => {
  it("sends X-Api-Key, network param, and parses JSON", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([{ ok: true }]));
    const client = new NexusClient({ apiKey: "k1", network: "PREPROD" });

    const out = await client.get<{ ok: boolean }[]>("/api/addresses/addr1/utxos", {
      page: 1,
    });

    expect(out).toEqual([{ ok: true }]);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://nexus.gerowallet.io/api/addresses/addr1/utxos?page=1&network=PREPROD",
    );
    expect(new Headers(init!.headers).get("X-Api-Key")).toBe("k1");
  });

  it("omits network param when not configured", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({}));
    const client = new NexusClient({ apiKey: "k1" });
    await client.get("/api/epoch/params");
    expect(String(fetchSpy.mock.calls[0]![0])).toBe(
      "https://nexus.gerowallet.io/api/epoch/params",
    );
  });

  it("throws NexusApiError with envelope message on 4xx, no retry", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ error: "Invalid address" }, 400));
    const client = new NexusClient({ apiKey: "k1" });

    await expect(client.get("/api/addresses/bad/utxos")).rejects.toMatchObject({
      name: "NexusApiError",
      status: 400,
      message: "Invalid address",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not leak raw body when envelope is absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>stack trace secrets</html>", { status: 500 }),
    );
    const client = new NexusClient({ apiKey: "k1", timeoutMs: 1000 });
    const err = (await client.post("/api/transactions/evaluate", {}).catch((e) => e)) as NexusApiError;
    expect(err).toBeInstanceOf(NexusApiError);
    expect(err.message).not.toContain("stack trace");
    expect(err.message).toBe("Nexus request failed with status 500");
  });

  it("retries GET twice on 5xx then succeeds", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "boom" }, 502))
      .mockResolvedValueOnce(jsonResponse({ error: "boom" }, 502))
      .mockResolvedValueOnce(jsonResponse({ fine: true }));
    const client = new NexusClient({ apiKey: "k1", retryDelaysMs: [0, 0] });
    const out = await client.get<{ fine: boolean }>("/api/epoch/params");
    expect(out).toEqual({ fine: true });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("never retries POST", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ error: "down" }, 503));
    const client = new NexusClient({ apiKey: "k1", retryDelaysMs: [0, 0] });
    await expect(client.post("/api/transactions/submit", "84a4")).rejects.toBeInstanceOf(NexusApiError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("postText sends text/plain and returns trimmed unquoted text", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('"abcd1234"', { status: 200 }));
    const client = new NexusClient({ apiKey: "k1" });
    const out = await client.postText("/api/transactions/submit", "84a4ff");
    expect(out).toBe("abcd1234");
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(new Headers(init!.headers).get("content-type")).toContain("text/plain");
    expect(init!.body).toBe("84a4ff");
  });
});
