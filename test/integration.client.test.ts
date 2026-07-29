import { describe, expect, it, type TestContext } from "vitest";
import { NexusClient, type NexusNetwork } from "../src/client.js";
import { NexusApiError } from "../src/errors.js";

/**
 * Live, read-only integration tests for the namespaced client. Skipped unless NEXUS_API_KEY
 * is set. Only GET/read endpoints are exercised — no tx submit/build. Env overrides:
 *   NEXUS_API_KEY            required to run any of these
 *   NEXUS_NETWORK            CARDANO_MAINNET (default) | CARDANO_PREPROD | CARDANO_PREVIEW
 *   NEXUS_BASE_URL           self-hosted deployments
 *   NEXUS_TEST_ADDRESS       enables address reads
 *   NEXUS_TEST_STAKE_ADDRESS enables account reads
 *   NEXUS_TEST_BTC_ADDRESS   enables bitcoin address reads
 *   NEXUS_MIDNIGHT_NETWORK   enables midnight info read (e.g. "undeployed")
 *
 * Nexus API keys are scoped by subscription tier + addons, so a given key may not be
 * entitled to every endpoint. A 402/403 is treated as "this key can't reach this endpoint"
 * and the test is skipped (not failed) via {@link entitled}, so the suite runs green with
 * any scoped key while still exercising everything the key can reach.
 */
const apiKey = process.env.NEXUS_API_KEY;
const network = (process.env.NEXUS_NETWORK as NexusNetwork | undefined) ?? "CARDANO_MAINNET";
const baseUrl = process.env.NEXUS_BASE_URL;
const address = process.env.NEXUS_TEST_ADDRESS;
const stakeAddress = process.env.NEXUS_TEST_STAKE_ADDRESS;
const btcAddress = process.env.NEXUS_TEST_BTC_ADDRESS;
const midnightNetwork = process.env.NEXUS_MIDNIGHT_NETWORK;

const isMainnet = network === "CARDANO_MAINNET";

// A placeholder key keeps construction from throwing during test collection when the suite
// is skipped (no NEXUS_API_KEY). The real key is used whenever it is present.
const makeClient = (net?: NexusNetwork) =>
  new NexusClient({ apiKey: apiKey ?? "integration-skipped", network: net, baseUrl });

/**
 * Runs a live call, skipping the test (instead of failing) when the key is not entitled to
 * the endpoint (402 Payment Required / 403 Forbidden). Any other error propagates.
 */
async function entitled<T>(ctx: TestContext, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (err instanceof NexusApiError && (err.status === 402 || err.status === 403)) {
      ctx.skip(`key not entitled (${err.status})`);
    }
    throw err;
  }
}

describe.skipIf(!apiKey)("client integration (read-only)", () => {
  const client = makeClient(network);

  describe("cardano", () => {
    it("network.info returns chain info", async (ctx) => {
      expect(await entitled(ctx, () => client.cardano.network.info())).toBeTruthy();
    });

    it("epochs.latest returns the current epoch", async (ctx) => {
      expect(await entitled(ctx, () => client.cardano.epochs.latest())).toBeTruthy();
    });

    it("epochs.latestParameters returns protocol params", async (ctx) => {
      expect(
        await entitled(ctx, () => client.cardano.epochs.latestParameters()),
      ).toBeTruthy();
    });

    it("blocks.latest returns the tip block", async (ctx) => {
      expect(await entitled(ctx, () => client.cardano.blocks.latest())).toBeTruthy();
    });

    it("pools.list returns an array", async (ctx) => {
      expect(Array.isArray(await entitled(ctx, () => client.cardano.pools.list()))).toBe(
        true,
      );
    });

    it("dreps.list returns a result", async (ctx) => {
      expect(await entitled(ctx, () => client.cardano.dreps.list())).toBeTruthy();
    });

    it.skipIf(!address)("addresses.utxos returns an array", async (ctx) => {
      expect(
        Array.isArray(await entitled(ctx, () => client.cardano.addresses.utxos(address!))),
      ).toBe(true);
    });

    it.skipIf(!stakeAddress)("accounts.info returns account info", async (ctx) => {
      expect(
        await entitled(ctx, () => client.cardano.accounts.info(stakeAddress!)),
      ).toBeTruthy();
    });
  });

  // Market data is Cardano mainnet only; use a network-unset client so the guard passes,
  // and only run when the configured network is mainnet (otherwise the key is not mainnet).
  describe.skipIf(!isMainnet)("cardano.market (mainnet)", () => {
    const market = makeClient().cardano.market;

    it("tokens returns market tokens", async (ctx) => {
      expect(await entitled(ctx, () => market.tokens())).toBeTruthy();
    });

    it("prices returns current prices", async (ctx) => {
      expect(await entitled(ctx, () => market.prices())).toBeTruthy();
    });

    it("dex.pools returns liquidity pools", async (ctx) => {
      expect(await entitled(ctx, () => market.dex.pools())).toBeTruthy();
    });

    it("sync.status returns indexer sync status", async (ctx) => {
      expect(await entitled(ctx, () => market.sync.status())).toBeTruthy();
    });
  });

  describe("bitcoin", () => {
    it("chain.tip returns the BTC chain tip", async (ctx) => {
      expect(await entitled(ctx, () => client.bitcoin.chain.tip())).toBeTruthy();
    });

    it("fees.estimates returns fee estimates", async (ctx) => {
      expect(await entitled(ctx, () => client.bitcoin.fees.estimates())).toBeTruthy();
    });

    it.skipIf(!btcAddress)("addresses.utxos returns an array", async (ctx) => {
      expect(
        Array.isArray(
          await entitled(ctx, () => client.bitcoin.addresses.utxos(btcAddress!)),
        ),
      ).toBe(true);
    });
  });

  describe.skipIf(!midnightNetwork)("midnight", () => {
    it("info.get returns network config", async (ctx) => {
      expect(
        await entitled(ctx, () => client.midnight.info.get(midnightNetwork!)),
      ).toBeTruthy();
    });
  });
}, 60_000);
