import { afterEach, describe, expect, it, vi } from "vitest";
import { NexusClient } from "../src/client.js";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const BASE = "https://nexus.gerowallet.io";

const client = new NexusClient({ apiKey: "k", retryDelaysMs: [] });

/** Spy that returns a fresh Response for every call (bodies can only be read once). */
const spyJson = (body: unknown = {}, status = 200) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() => Promise.resolve(jsonResponse(body, status)));

const url = (spy: ReturnType<typeof spyJson>, i = 0) => String(spy.mock.calls[i]![0]);
const init = (spy: ReturnType<typeof spyJson>, i = 0) => spy.mock.calls[i]![1]!;
const bodyOf = (spy: ReturnType<typeof spyJson>, i = 0) =>
  JSON.parse(init(spy, i).body as string);

afterEach(() => vi.restoreAllMocks());

// ---------------------------------------------------------------------------
// addresses  (client.cardano.addresses.*)
// ---------------------------------------------------------------------------
describe("cardano.addresses", () => {
  it("get builds /api/addresses/{address}", async () => {
    const spy = spyJson();
    await client.cardano.addresses.get("addr1xyz");
    expect(url(spy)).toBe(`${BASE}/api/addresses/addr1xyz`);
  });

  it("utxos builds path with default pagination page=1&pageSize=100", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.utxos("addr1xyz");
    expect(url(spy)).toBe(`${BASE}/api/addresses/addr1xyz/utxos?page=1&pageSize=100`);
  });

  it("utxos honours explicit pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.utxos("addr1xyz", { page: 3, pageSize: 25 });
    expect(url(spy)).toContain("page=3");
    expect(url(spy)).toContain("pageSize=25");
  });

  it("utxosWithAsset builds /api/addresses/{address}/utxos/{unit}", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.utxosWithAsset("addr1xyz", "policy0aabb");
    expect(url(spy)).toBe(
      `${BASE}/api/addresses/addr1xyz/utxos/policy0aabb?page=1&pageSize=100`,
    );
  });

  it("credentialUtxos builds /api/addresses/cred/{credential}/utxos", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.credentialUtxos("abcd01");
    expect(url(spy)).toBe(
      `${BASE}/api/addresses/cred/abcd01/utxos?page=1&pageSize=100`,
    );
  });

  it("credentialTransactions builds /api/addresses/cred/{credential}/transactions", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.credentialTransactions("abcd01");
    expect(url(spy)).toBe(
      `${BASE}/api/addresses/cred/abcd01/transactions?page=1&pageSize=100`,
    );
  });

  it("transactions builds /api/addresses/transactions/{address}", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.transactions("addr1xyz");
    expect(url(spy)).toBe(
      `${BASE}/api/addresses/transactions/addr1xyz?page=1&pageSize=100`,
    );
  });

  it("transactionHistory builds /api/addresses/{address}/transactions/history", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.transactionHistory("addr1xyz");
    expect(url(spy)).toBe(
      `${BASE}/api/addresses/addr1xyz/transactions/history?page=1&pageSize=100`,
    );
  });

  it("transactionsBySlot builds by-slot path with fromSlot/toSlot + pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.transactionsBySlot("addr1xyz", {
      fromSlot: 10,
      toSlot: 20,
      page: 2,
      pageSize: 50,
    });
    const u = url(spy);
    expect(u).toContain("/api/addresses/addr1xyz/transactions/by-slot?");
    expect(u).toContain("page=2");
    expect(u).toContain("pageSize=50");
    expect(u).toContain("fromSlot=10");
    expect(u).toContain("toSlot=20");
  });

  it("transactionsBySlot omits undefined slot params but keeps pagination defaults", async () => {
    const spy = spyJson([]);
    await client.cardano.addresses.transactionsBySlot("addr1xyz");
    const u = url(spy);
    expect(u).toContain("page=1&pageSize=100");
    expect(u).not.toContain("fromSlot");
    expect(u).not.toContain("toSlot");
  });
});

// ---------------------------------------------------------------------------
// accounts  (client.cardano.accounts.*)
// ---------------------------------------------------------------------------
describe("cardano.accounts", () => {
  it("info builds /api/account/{stakeAddress}/info", async () => {
    const spy = spyJson();
    await client.cardano.accounts.info("stake1uxyz");
    expect(url(spy)).toBe(`${BASE}/api/account/stake1uxyz/info`);
  });

  it("addresses builds /api/account/{stakeAddress}/addresses", async () => {
    const spy = spyJson([]);
    await client.cardano.accounts.addresses("stake1uxyz");
    expect(url(spy)).toBe(`${BASE}/api/account/stake1uxyz/addresses`);
  });

  it("assets builds /api/account/{stakeAddress}/assets with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.accounts.assets("stake1uxyz");
    expect(url(spy)).toBe(
      `${BASE}/api/account/stake1uxyz/assets?page=1&pageSize=100`,
    );
  });

  it("assets forwards optional policy filter", async () => {
    const spy = spyJson([]);
    await client.cardano.accounts.assets("stake1uxyz", { policy: "pol0", page: 2 });
    const u = url(spy);
    expect(u).toContain("policy=pol0");
    expect(u).toContain("page=2");
  });

  it("rewards builds /api/account/{stakeAddress}/rewards", async () => {
    const spy = spyJson([]);
    await client.cardano.accounts.rewards("stake1uxyz");
    expect(url(spy)).toBe(`${BASE}/api/account/stake1uxyz/rewards`);
  });

  it("txs builds /api/account/{stakeAddress}/txs with from query", async () => {
    const spy = spyJson([]);
    await client.cardano.accounts.txs("stake1uxyz", "abc123");
    expect(url(spy)).toBe(`${BASE}/api/account/stake1uxyz/txs?from=abc123`);
  });

  it("utxos builds /api/account/{stakeAddress}/utxos", async () => {
    const spy = spyJson([]);
    await client.cardano.accounts.utxos("stake1uxyz");
    expect(url(spy)).toBe(`${BASE}/api/account/stake1uxyz/utxos`);
  });
});

// ---------------------------------------------------------------------------
// assets  (client.cardano.assets.*)
// ---------------------------------------------------------------------------
describe("cardano.assets", () => {
  it("blacklist builds /api/assets/blacklist", async () => {
    const spy = spyJson([]);
    await client.cardano.assets.blacklist();
    expect(url(spy)).toBe(`${BASE}/api/assets/blacklist`);
  });

  it("detailedInfo builds /api/assets/detailedInfo with policy+name", async () => {
    const spy = spyJson({});
    await client.cardano.assets.detailedInfo("pol0", "name0");
    const u = url(spy);
    expect(u).toContain("/api/assets/detailedInfo?");
    expect(u).toContain("assetPolicy=pol0");
    expect(u).toContain("assetName=name0");
  });

  it("nftAddress builds /api/assets/nft-address with policy+name", async () => {
    const spy = spyJson({});
    await client.cardano.assets.nftAddress("pol0", "name0");
    const u = url(spy);
    expect(u).toContain("/api/assets/nft-address?");
    expect(u).toContain("assetPolicy=pol0");
    expect(u).toContain("assetName=name0");
  });

  it("holders builds /api/assets/{unit}/holders with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.assets.holders("unit0");
    expect(url(spy)).toBe(`${BASE}/api/assets/unit0/holders?page=1&pageSize=100`);
  });

  it("utxos builds /api/assets/{unit}/utxos with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.assets.utxos("unit0");
    expect(url(spy)).toBe(`${BASE}/api/assets/unit0/utxos?page=1&pageSize=100`);
  });
});

// ---------------------------------------------------------------------------
// blocks  (client.cardano.blocks.*)
// ---------------------------------------------------------------------------
describe("cardano.blocks", () => {
  it("list builds /api/blocks with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.blocks.list();
    expect(url(spy)).toBe(`${BASE}/api/blocks?page=1&pageSize=100`);
  });

  it("latest builds /api/blocks/latest", async () => {
    const spy = spyJson({});
    await client.cardano.blocks.latest();
    expect(url(spy)).toBe(`${BASE}/api/blocks/latest`);
  });

  it("byHash builds /api/blocks/{hash}", async () => {
    const spy = spyJson({});
    await client.cardano.blocks.byHash("blockhash0");
    expect(url(spy)).toBe(`${BASE}/api/blocks/blockhash0`);
  });

  it("byHash returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.blocks.byHash("missing")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// epochs  (client.cardano.epochs.*)
// ---------------------------------------------------------------------------
describe("cardano.epochs", () => {
  it("latest builds /api/epoch/latest", async () => {
    const spy = spyJson({});
    await client.cardano.epochs.latest();
    expect(url(spy)).toBe(`${BASE}/api/epoch/latest`);
  });

  it("latestParameters builds /api/epoch/latest/parameters", async () => {
    const spy = spyJson({});
    await client.cardano.epochs.latestParameters();
    expect(url(spy)).toBe(`${BASE}/api/epoch/latest/parameters`);
  });

  it("params builds /api/epoch/params without epoch_no by default", async () => {
    const spy = spyJson({});
    await client.cardano.epochs.params();
    expect(url(spy)).toBe(`${BASE}/api/epoch/params`);
  });

  it("params forwards epoch_no", async () => {
    const spy = spyJson({});
    await client.cardano.epochs.params({ epoch_no: 500 });
    expect(url(spy)).toBe(`${BASE}/api/epoch/params?epoch_no=500`);
  });
});

// ---------------------------------------------------------------------------
// network  (client.cardano.network.*)
// ---------------------------------------------------------------------------
describe("cardano.network", () => {
  it("info builds /api/network/info", async () => {
    const spy = spyJson({});
    await client.cardano.network.info();
    expect(url(spy)).toBe(`${BASE}/api/network/info`);
  });
});

// ---------------------------------------------------------------------------
// policy  (client.cardano.policy.*)
// ---------------------------------------------------------------------------
describe("cardano.policy", () => {
  it("assets builds /api/policy/{policyId}/assets with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.policy.assets("pol0");
    expect(url(spy)).toBe(`${BASE}/api/policy/pol0/assets?page=1&pageSize=100`);
  });

  it("utxos builds /api/policy/{policyId}/utxos with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.policy.utxos("pol0");
    expect(url(spy)).toBe(`${BASE}/api/policy/pol0/utxos?page=1&pageSize=100`);
  });
});

// ---------------------------------------------------------------------------
// scripts  (client.cardano.scripts.*)
// ---------------------------------------------------------------------------
describe("cardano.scripts", () => {
  it("byHash builds /api/scripts/{scriptHash}", async () => {
    const spy = spyJson({});
    await client.cardano.scripts.byHash("5".repeat(56));
    expect(url(spy)).toBe(`${BASE}/api/scripts/${"5".repeat(56)}`);
  });

  it("byHash returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.scripts.byHash("missing")).toBeNull();
  });

  it("datum builds /api/scripts/datum/{datumHash}", async () => {
    const spy = spyJson({});
    await client.cardano.scripts.datum("d".repeat(64));
    expect(url(spy)).toBe(`${BASE}/api/scripts/datum/${"d".repeat(64)}`);
  });

  it("datum returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.scripts.datum("missing")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// pools  (client.cardano.pools.*)
// ---------------------------------------------------------------------------
describe("cardano.pools", () => {
  it("list builds /api/pools", async () => {
    const spy = spyJson([]);
    await client.cardano.pools.list();
    expect(url(spy)).toBe(`${BASE}/api/pools`);
  });

  it("byId builds /api/pools/{id}", async () => {
    const spy = spyJson({});
    await client.cardano.pools.byId("pool1");
    expect(url(spy)).toBe(`${BASE}/api/pools/pool1`);
  });

  it("byId returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.pools.byId("missing")).toBeNull();
  });

  it("history builds /api/pools/{poolId}/history", async () => {
    const spy = spyJson([]);
    await client.cardano.pools.history("pool1");
    expect(url(spy)).toBe(`${BASE}/api/pools/pool1/history`);
  });

  it("epoch builds /api/pools/{poolId}/epochs/{epoch}", async () => {
    const spy = spyJson({});
    await client.cardano.pools.epoch("pool1", 500);
    expect(url(spy)).toBe(`${BASE}/api/pools/pool1/epochs/500`);
  });

  it("registrations builds /api/pools/registrations with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.pools.registrations();
    expect(url(spy)).toBe(`${BASE}/api/pools/registrations?page=1&pageSize=100`);
  });

  it("registrationsByEpoch builds /api/pools/registrations/{epoch} with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.pools.registrationsByEpoch(500);
    expect(url(spy)).toBe(
      `${BASE}/api/pools/registrations/500?page=1&pageSize=100`,
    );
  });

  it("retirements builds /api/pools/retirements with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.pools.retirements();
    expect(url(spy)).toBe(`${BASE}/api/pools/retirements?page=1&pageSize=100`);
  });

  it("retiring builds /api/pools/retiring/{epoch}", async () => {
    const spy = spyJson([]);
    await client.cardano.pools.retiring(500);
    expect(url(spy)).toBe(`${BASE}/api/pools/retiring/500`);
  });
});

// ---------------------------------------------------------------------------
// dreps  (client.cardano.dreps.*)
// ---------------------------------------------------------------------------
describe("cardano.dreps", () => {
  it("list builds /api/dreps with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.dreps.list();
    expect(url(spy)).toBe(`${BASE}/api/dreps?page=1&pageSize=100`);
  });

  it("list forwards search/status/sort filters", async () => {
    const spy = spyJson([]);
    await client.cardano.dreps.list({ search: "foo", status: "active", sort: "voting_power" });
    const u = url(spy);
    expect(u).toContain("search=foo");
    expect(u).toContain("status=active");
    expect(u).toContain("sort=voting_power");
  });

  it("byId builds /api/dreps/{drepId}", async () => {
    const spy = spyJson({});
    await client.cardano.dreps.byId("drep1");
    expect(url(spy)).toBe(`${BASE}/api/dreps/drep1`);
  });

  it("byId returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.dreps.byId("missing")).toBeNull();
  });

  it("delegators builds /api/dreps/{drepId}/delegators with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.dreps.delegators("drep1");
    expect(url(spy)).toBe(`${BASE}/api/dreps/drep1/delegators?page=1&pageSize=100`);
  });
});

// ---------------------------------------------------------------------------
// governance  (client.cardano.governance.*)
// ---------------------------------------------------------------------------
describe("cardano.governance", () => {
  it("committee builds /api/governance/committee", async () => {
    const spy = spyJson({});
    await client.cardano.governance.committee();
    expect(url(spy)).toBe(`${BASE}/api/governance/committee`);
  });

  it("constitution builds /api/governance/constitution", async () => {
    const spy = spyJson({});
    await client.cardano.governance.constitution();
    expect(url(spy)).toBe(`${BASE}/api/governance/constitution`);
  });

  it("dreps builds /api/governance/dreps with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.dreps();
    expect(url(spy)).toBe(`${BASE}/api/governance/dreps?page=1&pageSize=100`);
  });

  it("dreps forwards filters incl. stringified hasMetadata", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.dreps({
      search: "foo",
      status: "active",
      sort: "vp",
      hasMetadata: true,
    });
    const u = url(spy);
    expect(u).toContain("search=foo");
    expect(u).toContain("status=active");
    expect(u).toContain("sort=vp");
    expect(u).toContain("hasMetadata=true");
  });

  it("dreps omits hasMetadata when undefined", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.dreps({ search: "foo" });
    expect(url(spy)).not.toContain("hasMetadata");
  });

  it("drep builds /api/governance/dreps/{drepId}", async () => {
    const spy = spyJson({});
    await client.cardano.governance.drep("drep1");
    expect(url(spy)).toBe(`${BASE}/api/governance/dreps/drep1`);
  });

  it("drep returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.governance.drep("missing")).toBeNull();
  });

  it("drepDelegators builds /api/governance/dreps/{drepId}/delegators", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.drepDelegators("drep1");
    expect(url(spy)).toBe(
      `${BASE}/api/governance/dreps/drep1/delegators?page=1&pageSize=100`,
    );
  });

  it("drepVotes builds /api/governance/dreps/{drepId}/votes", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.drepVotes("drep1");
    expect(url(spy)).toBe(
      `${BASE}/api/governance/dreps/drep1/votes?page=1&pageSize=100`,
    );
  });

  it("proposals builds /api/governance/proposals with pagination", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.proposals();
    expect(url(spy)).toBe(`${BASE}/api/governance/proposals?page=1&pageSize=100`);
  });

  it("proposals forwards type/status filters", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.proposals({ type: "InfoAction", status: "open" });
    const u = url(spy);
    expect(u).toContain("type=InfoAction");
    expect(u).toContain("status=open");
  });

  it("proposal builds /api/governance/proposals/{govActionId}", async () => {
    const spy = spyJson({});
    await client.cardano.governance.proposal("gov1");
    expect(url(spy)).toBe(`${BASE}/api/governance/proposals/gov1`);
  });

  it("proposal returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.governance.proposal("missing")).toBeNull();
  });

  it("proposalVotes builds /api/governance/proposals/{govActionId}/votes", async () => {
    const spy = spyJson([]);
    await client.cardano.governance.proposalVotes("gov1");
    expect(url(spy)).toBe(
      `${BASE}/api/governance/proposals/gov1/votes?page=1&pageSize=100`,
    );
  });

  it("votingSummary builds /api/governance/proposals/{govActionId}/voting-summary", async () => {
    const spy = spyJson({});
    await client.cardano.governance.votingSummary("gov1");
    expect(url(spy)).toBe(
      `${BASE}/api/governance/proposals/gov1/voting-summary`,
    );
  });
});

// ---------------------------------------------------------------------------
// transactions  (client.cardano.transactions.*)
// ---------------------------------------------------------------------------
describe("cardano.transactions", () => {
  it("byHash builds /api/transactions/{txHash}", async () => {
    const spy = spyJson({});
    await client.cardano.transactions.byHash("a".repeat(64));
    expect(url(spy)).toBe(`${BASE}/api/transactions/${"a".repeat(64)}`);
  });

  it("byHash returns null on 404", async () => {
    spyJson({ error: "not found" }, 404);
    expect(await client.cardano.transactions.byHash("missing")).toBeNull();
  });

  it("utxos builds /api/transactions/{txHash}/utxos", async () => {
    const spy = spyJson({});
    await client.cardano.transactions.utxos("a".repeat(64));
    expect(url(spy)).toBe(`${BASE}/api/transactions/${"a".repeat(64)}/utxos`);
  });

  it("cbor builds /api/transactions/{txHash}/cbor", async () => {
    const spy = spyJson({});
    await client.cardano.transactions.cbor("a".repeat(64));
    expect(url(spy)).toBe(`${BASE}/api/transactions/${"a".repeat(64)}/cbor`);
  });

  it("utxosBatch POSTs to /api/transactions/utxos with the body", async () => {
    const spy = spyJson([]);
    const payload = [{ txHash: "aa", outputIndex: 0 }];
    await client.cardano.transactions.utxosBatch(payload as never);
    expect(url(spy)).toBe(`${BASE}/api/transactions/utxos`);
    expect(init(spy).method).toBe("POST");
    expect(bodyOf(spy)).toEqual(payload);
  });

  it("cborBatch POSTs to /api/transactions/cbor with the body", async () => {
    const spy = spyJson([]);
    const payload = ["aa", "bb"];
    await client.cardano.transactions.cborBatch(payload as never);
    expect(url(spy)).toBe(`${BASE}/api/transactions/cbor`);
    expect(init(spy).method).toBe("POST");
    expect(bodyOf(spy)).toEqual(payload);
  });

  it("evaluate POSTs to /api/transactions/evaluate with the body", async () => {
    const spy = spyJson([]);
    const payload = { cbor: "84a400", additionalUtxoSet: [] };
    await client.cardano.transactions.evaluate(payload as never);
    expect(url(spy)).toBe(`${BASE}/api/transactions/evaluate`);
    expect(init(spy).method).toBe("POST");
    expect(bodyOf(spy)).toEqual(payload);
  });

  it("submit POSTs raw text to /api/transactions/submit and returns the hash", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("deadbeef", { status: 200 }));
    const hash = await client.cardano.transactions.submit("84a400");
    expect(url(spy)).toBe(`${BASE}/api/transactions/submit`);
    expect(init(spy).method).toBe("POST");
    expect(init(spy).body).toBe("84a400");
    expect((init(spy).headers as Record<string, string>)["content-type"]).toBe(
      "text/plain",
    );
    expect(hash).toBe("deadbeef");
  });
});

// ---------------------------------------------------------------------------
// tx-builder  (client.cardano.txBuilder.*)
// ---------------------------------------------------------------------------
describe("cardano.txBuilder", () => {
  const cases: Array<[keyof NexusClient["cardano"]["txBuilder"], string]> = [
    ["build", "/api/tx/build"],
    ["delegation", "/api/tx/build/delegation"],
    ["stakeRegistration", "/api/tx/build/stake-registration"],
    ["voteDelegation", "/api/tx/build/vote-delegation"],
    ["drepRegistration", "/api/tx/build/drep-registration"],
    ["withdrawal", "/api/tx/build/withdrawal"],
    ["maxAda", "/api/tx/max-ada"],
  ];
  for (const [method, path] of cases) {
    it(`${String(method)} POSTs to ${path} with the JSON body`, async () => {
      const spy = spyJson({});
      const payload = { changeAddress: "addr1", marker: String(method) };
      // biome-ignore lint: dynamic dispatch across the builder methods
      await (client.cardano.txBuilder[method] as (b: unknown) => Promise<unknown>)(payload);
      expect(url(spy)).toBe(`${BASE}${path}`);
      expect(init(spy).method).toBe("POST");
      expect((init(spy).headers as Record<string, string>)["content-type"]).toBe(
        "application/json",
      );
      expect(bodyOf(spy)).toEqual(payload);
    });
  }
});
