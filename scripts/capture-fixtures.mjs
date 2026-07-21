// Usage: NEXUS_API_KEY=... [NEXUS_BASE_URL=...] [NEXUS_NETWORK=CARDANO_PREPROD] \
//        node scripts/capture-fixtures.mjs addr_test1... stake_test1...
import { mkdir, writeFile } from "node:fs/promises";

const API_KEY = process.env.NEXUS_API_KEY;
const BASE_URL = process.env.NEXUS_BASE_URL ?? "https://nexus.gerowallet.io";
const NETWORK = process.env.NEXUS_NETWORK ?? "CARDANO_PREPROD";
if (!API_KEY) throw new Error("NEXUS_API_KEY env var required");

const [address, stakeAddress] = process.argv.slice(2);
if (!address || !stakeAddress) throw new Error("Usage: capture-fixtures.mjs <address> <stakeAddress>");

async function capture(name, path) {
  const url = new URL(BASE_URL + path);
  url.searchParams.set("network", NETWORK);
  const res = await fetch(url, { headers: { "X-Api-Key": API_KEY } });
  const body = await res.json().catch(() => null);
  await writeFile(`test/fixtures/${name}.json`, JSON.stringify(body, null, 2));
  console.log(`${name}: HTTP ${res.status}`);
}

await mkdir("test/fixtures", { recursive: true });
await capture("address-utxos", `/api/addresses/${address}/utxos`);
await capture("account-info", `/api/account/${stakeAddress}/info`);
await capture("protocol-params", "/api/epoch/params");
