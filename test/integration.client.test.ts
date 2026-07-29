import { describe, expect, it } from "vitest";
import { NexusClient, type NexusNetwork } from "../src/client.js";

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

describe.skipIf(!apiKey)("client integration (read-only)", () => {
  const client = makeClient(network);

  describe("cardano", () => {
    it("network.info returns chain info", async () => {
      const info = await client.cardano.network.info();
      expect(info).toBeTruthy();
    });

    it("epochs.latest returns the current epoch", async () => {
      const epoch = await client.cardano.epochs.latest();
      expect(epoch).toBeTruthy();
    });

    it("epochs.latestParameters returns protocol params", async () => {
      const params = await client.cardano.epochs.latestParameters();
      expect(params).toBeTruthy();
    });

    it("blocks.latest returns the tip block", async () => {
      const block = await client.cardano.blocks.latest();
      expect(block).toBeTruthy();
    });

    it("pools.list returns an array", async () => {
      const pools = await client.cardano.pools.list();
      expect(Array.isArray(pools)).toBe(true);
    });

    it("dreps.list returns a result", async () => {
      const dreps = await client.cardano.dreps.list();
      expect(dreps).toBeTruthy();
    });

    it.skipIf(!address)("addresses.utxos returns an array", async () => {
      const utxos = await client.cardano.addresses.utxos(address!);
      expect(Array.isArray(utxos)).toBe(true);
    });

    it.skipIf(!stakeAddress)("accounts.info returns account info", async () => {
      const info = await client.cardano.accounts.info(stakeAddress!);
      expect(info).toBeTruthy();
    });
  });

  // Market data is Cardano mainnet only; use a network-unset client so the guard passes,
  // and only run when the configured network is mainnet (otherwise the key is not mainnet).
  describe.skipIf(!isMainnet)("cardano.market (mainnet)", () => {
    const market = makeClient().cardano.market;

    it("tokens returns market tokens", async () => {
      expect(await market.tokens()).toBeTruthy();
    });

    it("prices returns current prices", async () => {
      expect(await market.prices()).toBeTruthy();
    });

    it("dex.pools returns liquidity pools", async () => {
      expect(await market.dex.pools()).toBeTruthy();
    });

    it("sync.status returns indexer sync status", async () => {
      expect(await market.sync.status()).toBeTruthy();
    });
  });

  describe("bitcoin", () => {
    it("chain.tip returns the BTC chain tip", async () => {
      expect(await client.bitcoin.chain.tip()).toBeTruthy();
    });

    it("fees.estimates returns fee estimates", async () => {
      expect(await client.bitcoin.fees.estimates()).toBeTruthy();
    });

    it.skipIf(!btcAddress)("addresses.utxos returns an array", async () => {
      const utxos = await client.bitcoin.addresses.utxos(btcAddress!);
      expect(Array.isArray(utxos)).toBe(true);
    });
  });

  describe.skipIf(!midnightNetwork)("midnight", () => {
    it("info.get returns network config", async () => {
      expect(await client.midnight.info.get(midnightNetwork!)).toBeTruthy();
    });
  });
}, 60_000);
