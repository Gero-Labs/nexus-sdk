# @adlabs/nexus SDK + lucid-evolution Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@adlabs/nexus` — a typed TypeScript client for the Nexus Cardano API with a lucid-evolution `Provider` adapter at the `/lucid` subpath.

**Architecture:** Zero-runtime-dependency core (`NexusClient` over native `fetch`) with thin per-domain endpoint modules; a separate `lucid/` layer holds pure mapper functions (Nexus DTO → lucid types) and `NexusProvider`, which composes client + mappers. Spec: `docs/specs/2026-07-21-nexus-sdk-lucid-provider-design.md`.

**Tech Stack:** TypeScript 5 (strict), tsup (ESM+CJS+d.ts), vitest, eslint (flat config), `@lucid-evolution/core-types` (types only), Node >= 20.

## Global Constraints

- Repo root: `/Users/dudiedri/IdeaProjects/A.D. Labs/nexus-sdk` (branch `main`, remote `Gero-Labs/nexus-sdk`).
- Package name: `@adlabs/nexus`. Subpath exports: `.` and `./lucid`.
- Node `>=20` (native fetch). No runtime dependencies in core; `@lucid-evolution/core-types` is the only runtime dep, imported ONLY from `src/lucid/`.
- Default base URL: `https://nexus.gerowallet.io`. Auth header: `X-Api-Key`. Network query param: `?network=MAINNET|PREPROD|PREVIEW`.
- Never log or embed the API key in errors. Error messages come from the Nexus error envelope `{ "error": "..." }` only — never raw bodies.
- Retries: idempotent GETs only, max 2, backoff 250ms/1000ms, on network error or 5xx. Never retry POST.
- All quantities → `bigint` in lucid-facing types.
- Every commit message ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Verified Nexus response shapes (from `Gero-Labs/nexus` Java sources, 2026-07-21) — treat as authoritative:
  - `GET /api/addresses/{address}/utxos`, `/api/addresses/cred/{credential}/utxos`, `/api/addresses/{address}/utxos/{asset}`, `/api/assets/{unit}/utxos` → `AddressUtxoDto[]`, paginated `page` (1-based, default 1) / `pageSize` (default 100, max 100).
  - `POST /api/transactions/utxos` body `[{txHash, outputIndex}]` (max 100) → `UtxoDto[]` (different shape from AddressUtxoDto!).
  - `GET /api/scripts/datum/{datumHash}` → `{hash, cbor, json}`.
  - `GET /api/scripts/{scriptHash}` → `{hash, type, cbor, size, json}`.
  - `GET /api/account/{stakeAddress}/info` → `{active, poolId, withdrawableAmount, ...}`.
  - `GET /api/epoch/params` → flat Blockfrost-style `ProtocolParamsDto` (fields listed in Task 4).
  - `POST /api/transactions/submit` body = raw CBOR hex string → tx hash string.
  - `POST /api/transactions/evaluate` body `{cbor, additionalUtxoSet}` → `[{redeemerTag, index, exUnits: {mem, steps}}]`. `additionalUtxoSet` is passed through verbatim as Ogmios v6 `additionalUtxo`.
  - `GET /api/transactions/{txHash}` → transaction details; 404/error when unknown.

---

### Task 1: Repo scaffold + build/test toolchain

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `.gitignore`, `.nvmrc`, `src/index.ts`, `src/lucid/index.ts`, `test/smoke.test.ts`

**Interfaces:**
- Produces: working `npm run build` (dist ESM+CJS+d.ts for both entries), `npm test`, `npm run lint`, `npm run typecheck`.

- [ ] **Step 1: Write configs**

`package.json`:
```json
{
  "name": "@adlabs/nexus",
  "version": "0.1.0",
  "description": "TypeScript SDK for the Nexus Cardano API — typed client + lucid-evolution provider",
  "license": "MIT",
  "repository": { "type": "git", "url": "https://github.com/Gero-Labs/nexus-sdk.git" },
  "type": "module",
  "engines": { "node": ">=20" },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./lucid": { "types": "./dist/lucid/index.d.ts", "import": "./dist/lucid/index.js", "require": "./dist/lucid/index.cjs" }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@lucid-evolution/core-types": "^0.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```
Before writing, check the real latest `@lucid-evolution/core-types` version with `npm view @lucid-evolution/core-types version` and use `^<that>`.

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "declaration": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

`tsup.config.ts`:
```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "lucid/index": "src/lucid/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"] },
});
```

`eslint.config.mjs`:
```js
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  { ignores: ["dist/**"] },
);
```

`.gitignore`:
```
node_modules/
dist/
*.tsbuildinfo
.env
```

`.nvmrc`:
```
20
```

`src/index.ts` (placeholder, replaced in Task 2):
```ts
export {};
```

`src/lucid/index.ts` (placeholder, replaced in Task 6):
```ts
export {};
```

`test/smoke.test.ts`:
```ts
import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Install and verify all gates**

Run: `cd "/Users/dudiedri/IdeaProjects/A.D. Labs/nexus-sdk" && npm install && npm run build && npm test && npm run lint && npm run typecheck`
Expected: build emits `dist/index.js|cjs|d.ts` and `dist/lucid/index.js|cjs|d.ts`; 1 test passes; lint/typecheck clean.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: scaffold @adlabs/nexus toolchain (tsup, vitest, eslint)"
```

---

### Task 2: NexusApiError + NexusClient

**Files:**
- Create: `src/errors.ts`, `src/client.ts`
- Modify: `src/index.ts`
- Test: `test/client.test.ts`

**Interfaces:**
- Produces:
  - `class NexusApiError extends Error { status: number; code?: string }`
  - `interface NexusClientOptions { apiKey: string; baseUrl?: string; network?: NexusNetwork; timeoutMs?: number }`
  - `type NexusNetwork = "MAINNET" | "PREPROD" | "PREVIEW"`
  - `class NexusClient { get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T>; post<T>(path: string, body: unknown): Promise<T>; postText(path: string, body: string): Promise<string> }`
- Consumes: nothing.

- [ ] **Step 1: Write failing tests**

`test/client.test.ts`:
```ts
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
    const err = await client.post("/api/transactions/evaluate", {}).catch((e) => e as NexusApiError);
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
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/client.js`.

- [ ] **Step 3: Implement**

`src/errors.ts`:
```ts
/** Error thrown for any non-2xx Nexus API response. */
export class NexusApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "NexusApiError";
    this.status = status;
    this.code = code;
  }
}
```

`src/client.ts`:
```ts
import { NexusApiError } from "./errors.js";

export type NexusNetwork = "MAINNET" | "PREPROD" | "PREVIEW";

export interface NexusClientOptions {
  apiKey: string;
  /** Defaults to https://nexus.gerowallet.io */
  baseUrl?: string;
  /** Sent as ?network= on every request. Omit to use the API key's scoped network. */
  network?: NexusNetwork;
  /** Per-attempt timeout. Default 30_000. */
  timeoutMs?: number;
  /** Backoff schedule for GET retries. Default [250, 1000]. Exposed for tests. */
  retryDelaysMs?: number[];
}

const DEFAULT_BASE_URL = "https://nexus.gerowallet.io";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function errorFromResponse(res: Response): Promise<NexusApiError> {
  let message = `Nexus request failed with status ${res.status}`;
  try {
    const body: unknown = await res.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
    ) {
      message = (body as { error: string }).error;
    }
  } catch {
    // Non-JSON body: keep the generic message; never surface raw bodies.
  }
  return new NexusApiError(res.status, message);
}

export class NexusClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly network?: NexusNetwork;
  private readonly timeoutMs: number;
  private readonly retryDelaysMs: number[];

  constructor(options: NexusClientOptions) {
    if (!options.apiKey) throw new Error("NexusClient requires an apiKey");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.network = options.network;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.retryDelaysMs = options.retryDelaysMs ?? [250, 1000];
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    if (this.network) url.searchParams.set("network", this.network);
    return url.toString();
  }

  private async request(url: string, init: RequestInit, retry: boolean): Promise<Response> {
    const attempts = retry ? this.retryDelaysMs.length + 1 : 1;
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) await sleep(this.retryDelaysMs[attempt - 1] ?? 0);
      try {
        const res = await fetch(url, {
          ...init,
          headers: { "X-Api-Key": this.apiKey, ...init.headers },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (res.ok) return res;
        if (res.status >= 500 && attempt < attempts - 1) {
          lastError = await errorFromResponse(res);
          continue;
        }
        throw await errorFromResponse(res);
      } catch (error) {
        if (error instanceof NexusApiError) throw error;
        // Network / timeout error.
        lastError = error;
        if (attempt >= attempts - 1) break;
      }
    }
    if (lastError instanceof NexusApiError) throw lastError;
    throw new NexusApiError(0, "Nexus request failed: network error or timeout");
  }

  async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const res = await this.request(this.buildUrl(path, query), { method: "GET" }, true);
    return (await res.json()) as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.request(
      this.buildUrl(path),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      false,
    );
    return (await res.json()) as T;
  }

  /** POST a raw text body (tx submit) and return the response as plain text. */
  async postText(path: string, body: string): Promise<string> {
    const res = await this.request(
      this.buildUrl(path),
      { method: "POST", headers: { "content-type": "text/plain" }, body },
      false,
    );
    const text = await res.text();
    return text.trim().replace(/^"|"$/g, "");
  }
}
```

`src/index.ts`:
```ts
export { NexusClient } from "./client.js";
export type { NexusClientOptions, NexusNetwork } from "./client.js";
export { NexusApiError } from "./errors.js";
```

- [ ] **Step 4: Run gates**

Run: `npm test && npm run lint && npm run typecheck`
Expected: all client tests PASS (smoke test may now be deleted), lint/typecheck clean. Delete `test/smoke.test.ts` in this step.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: NexusClient fetch wrapper with auth, retries, safe errors"
```

---

### Task 3: Nexus DTO types + endpoint modules

**Files:**
- Create: `src/types.ts`, `src/endpoints/addresses.ts`, `src/endpoints/account.ts`, `src/endpoints/assets.ts`, `src/endpoints/transactions.ts`, `src/endpoints/epoch.ts`, `src/endpoints/scripts.ts`
- Modify: `src/index.ts`
- Test: `test/endpoints.test.ts`

**Interfaces:**
- Consumes: `NexusClient.get/post/postText` from Task 2.
- Produces (used by Tasks 4–6):
  - Types: `NexusAddressUtxo`, `NexusAssetBalance`, `NexusInlineDatum`, `NexusReferenceScript`, `NexusOutRefUtxo`, `NexusAmount`, `NexusProtocolParams`, `NexusAccountInfo`, `NexusDatum`, `NexusScriptDetail`, `NexusRedeemerEval`, `NexusOutRefRequest`
  - Functions (each takes `client: NexusClient` first):
    - `getAddressUtxos(client, address, page, pageSize): Promise<NexusAddressUtxo[]>`
    - `getCredentialUtxos(client, credentialHash, page, pageSize): Promise<NexusAddressUtxo[]>`
    - `getAddressUtxosWithAsset(client, address, unit, page, pageSize): Promise<NexusAddressUtxo[]>`
    - `getAssetUtxos(client, unit, page, pageSize): Promise<NexusAddressUtxo[]>`
    - `getUtxosByOutRefs(client, outRefs: NexusOutRefRequest[]): Promise<NexusOutRefUtxo[]>` (chunks input into groups of 100)
    - `getAccountInfo(client, stakeAddress): Promise<NexusAccountInfo>`
    - `getDatum(client, datumHash): Promise<NexusDatum>`
    - `getScript(client, scriptHash): Promise<NexusScriptDetail>`
    - `getProtocolParams(client): Promise<NexusProtocolParams>`
    - `getTransaction(client, txHash): Promise<unknown | null>` (null on 404)
    - `submitTx(client, cborHex): Promise<string>`
    - `evaluateTx(client, cborHex, additionalUtxoSet?): Promise<NexusRedeemerEval[]>`

- [ ] **Step 1: Write DTO types**

`src/types.ts` (field names mirror the Java DTOs exactly; all optional-by-default because Jackson omits nulls):
```ts
export interface NexusAssetBalance {
  unit: string;
  policyId?: string;
  assetName?: string;
  fingerprint?: string;
  quantity: string;
  decimals?: number;
  hasOnchainMetadata?: boolean;
}

export interface NexusInlineDatum {
  bytes?: string;
  value?: unknown;
}

export interface NexusReferenceScript {
  hash?: string;
  size?: number;
  type?: string;
  bytes?: string;
  value?: unknown;
}

/** Shape of GET /api/addresses/.../utxos and /api/assets/{unit}/utxos entries. */
export interface NexusAddressUtxo {
  txHash: string;
  txIndex: number;
  address: string;
  stakeAddress?: string;
  paymentCred?: string;
  /** Lovelace amount as string. */
  value: string;
  datumHash?: string;
  inlineDatum?: NexusInlineDatum;
  referenceScript?: NexusReferenceScript;
  assets?: NexusAssetBalance[];
  spent?: boolean;
  slot?: number;
  blockHash?: string;
  blockHeight?: number;
  blockTime?: number;
  epoch?: number;
  cborHex?: string;
}

export interface NexusAmount {
  unit: string;
  quantity: string;
  policyId?: string;
  assetName?: string;
}

/** Shape of POST /api/transactions/utxos entries (different DTO from NexusAddressUtxo). */
export interface NexusOutRefUtxo {
  txHash: string;
  outputIndex: number;
  address: string;
  amount?: NexusAmount[];
  lovelaceAmount?: number;
  dataHash?: string;
  /** Inline datum CBOR hex. */
  inlineDatum?: string;
  inlineDatumJson?: Record<string, unknown>;
  referenceScriptHash?: string;
  /** Reference script CBOR hex. */
  scriptRef?: string;
  collateral?: boolean;
  reference?: boolean;
  consumedByTx?: string;
}

export interface NexusOutRefRequest {
  txHash: string;
  outputIndex: number;
}

export interface NexusProtocolParams {
  minFeeA: number;
  minFeeB: number;
  maxTxSize: number;
  maxValSize: string;
  keyDeposit: string;
  poolDeposit: string;
  drepDeposit?: string | number;
  govActionDeposit?: string | number;
  priceMem: number;
  priceStep: number;
  maxTxExMem: string;
  maxTxExSteps: string;
  coinsPerUtxoSize: string;
  collateralPercent: number;
  maxCollateralInputs: number;
  minFeeRefScriptCostPerByte?: number;
  protocolMajorVer?: number;
  protocolMinorVer?: number;
  costModels: Record<string, Record<string, number>>;
}

export interface NexusAccountInfo {
  stakeAddress?: string;
  active?: boolean;
  poolId?: string;
  drepId?: string;
  withdrawableAmount?: string;
  controlledAmount?: string;
}

export interface NexusDatum {
  hash?: string;
  cbor?: string;
  json?: unknown;
}

export interface NexusScriptDetail {
  hash?: string;
  type?: string;
  cbor?: string;
  size?: number;
  json?: unknown;
}

export interface NexusExUnits {
  mem: number;
  steps: number;
}

export interface NexusRedeemerEval {
  redeemerTag: string;
  index: number;
  exUnits: NexusExUnits;
}
```

- [ ] **Step 2: Write failing endpoint tests**

`test/endpoints.test.ts`:
```ts
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
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
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
      .mockResolvedValue(jsonResponse([{ txHash: "aa", outputIndex: 0, address: "addr1" }]));
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
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
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
```

- [ ] **Step 3: Run tests, verify fail**

Run: `npm test`
Expected: FAIL — endpoint modules unresolved.

- [ ] **Step 4: Implement endpoint modules**

`src/endpoints/addresses.ts`:
```ts
import type { NexusClient } from "../client.js";
import type { NexusAddressUtxo } from "../types.js";

export function getAddressUtxos(
  client: NexusClient,
  address: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(`/api/addresses/${encodeURIComponent(address)}/utxos`, { page, pageSize });
}

export function getCredentialUtxos(
  client: NexusClient,
  credentialHash: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(`/api/addresses/cred/${encodeURIComponent(credentialHash)}/utxos`, {
    page,
    pageSize,
  });
}

export function getAddressUtxosWithAsset(
  client: NexusClient,
  address: string,
  unit: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(
    `/api/addresses/${encodeURIComponent(address)}/utxos/${encodeURIComponent(unit)}`,
    { page, pageSize },
  );
}
```

`src/endpoints/assets.ts`:
```ts
import type { NexusClient } from "../client.js";
import type { NexusAddressUtxo } from "../types.js";

export function getAssetUtxos(
  client: NexusClient,
  unit: string,
  page: number,
  pageSize: number,
): Promise<NexusAddressUtxo[]> {
  return client.get(`/api/assets/${encodeURIComponent(unit)}/utxos`, { page, pageSize });
}
```

`src/endpoints/account.ts`:
```ts
import type { NexusClient } from "../client.js";
import type { NexusAccountInfo } from "../types.js";

export function getAccountInfo(
  client: NexusClient,
  stakeAddress: string,
): Promise<NexusAccountInfo> {
  return client.get(`/api/account/${encodeURIComponent(stakeAddress)}/info`);
}
```

`src/endpoints/epoch.ts`:
```ts
import type { NexusClient } from "../client.js";
import type { NexusProtocolParams } from "../types.js";

export function getProtocolParams(client: NexusClient): Promise<NexusProtocolParams> {
  return client.get("/api/epoch/params");
}
```

`src/endpoints/scripts.ts`:
```ts
import type { NexusClient } from "../client.js";
import type { NexusDatum, NexusScriptDetail } from "../types.js";

export function getDatum(client: NexusClient, datumHash: string): Promise<NexusDatum> {
  return client.get(`/api/scripts/datum/${encodeURIComponent(datumHash)}`);
}

export function getScript(client: NexusClient, scriptHash: string): Promise<NexusScriptDetail> {
  return client.get(`/api/scripts/${encodeURIComponent(scriptHash)}`);
}
```

`src/endpoints/transactions.ts`:
```ts
import type { NexusClient } from "../client.js";
import { NexusApiError } from "../errors.js";
import type { NexusOutRefRequest, NexusOutRefUtxo, NexusRedeemerEval } from "../types.js";

const OUT_REF_BATCH = 100;

export async function getUtxosByOutRefs(
  client: NexusClient,
  outRefs: NexusOutRefRequest[],
): Promise<NexusOutRefUtxo[]> {
  const results: NexusOutRefUtxo[] = [];
  for (let i = 0; i < outRefs.length; i += OUT_REF_BATCH) {
    const chunk = outRefs.slice(i, i + OUT_REF_BATCH);
    results.push(...(await client.post<NexusOutRefUtxo[]>("/api/transactions/utxos", chunk)));
  }
  return results;
}

export async function getTransaction(
  client: NexusClient,
  txHash: string,
): Promise<unknown | null> {
  try {
    return await client.get(`/api/transactions/${encodeURIComponent(txHash)}`);
  } catch (error) {
    if (error instanceof NexusApiError && error.status === 404) return null;
    throw error;
  }
}

export function submitTx(client: NexusClient, cborHex: string): Promise<string> {
  return client.postText("/api/transactions/submit", cborHex);
}

export function evaluateTx(
  client: NexusClient,
  cborHex: string,
  additionalUtxoSet?: unknown[],
): Promise<NexusRedeemerEval[]> {
  return client.post("/api/transactions/evaluate", {
    cbor: cborHex,
    additionalUtxoSet: additionalUtxoSet ?? null,
  });
}
```

Update `src/index.ts`:
```ts
export { NexusClient } from "./client.js";
export type { NexusClientOptions, NexusNetwork } from "./client.js";
export { NexusApiError } from "./errors.js";
export * from "./types.js";
export * from "./endpoints/addresses.js";
export * from "./endpoints/account.js";
export * from "./endpoints/assets.js";
export * from "./endpoints/transactions.js";
export * from "./endpoints/epoch.js";
export * from "./endpoints/scripts.js";
```

- [ ] **Step 5: Run gates**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: Nexus DTO types and typed endpoint modules"
```

---

### Task 4: Lucid mappers

**Files:**
- Create: `src/lucid/mappers.ts`
- Test: `test/mappers.test.ts`

**Interfaces:**
- Consumes: DTO types from Task 3; lucid types from `@lucid-evolution/core-types`.
- Produces (used by Task 6):
  - `toLucidUtxoFromAddressUtxo(dto: NexusAddressUtxo): UTxO`
  - `toLucidUtxoFromOutRefUtxo(dto: NexusOutRefUtxo): UTxO`
  - `toLucidProtocolParameters(dto: NexusProtocolParams): ProtocolParameters`
  - `toLucidDelegation(dto: NexusAccountInfo): Delegation`
  - `toLucidEvalRedeemers(dtos: NexusRedeemerEval[]): EvalRedeemer[]`
  - `toLucidScript(type: string | undefined, cborHex: string): Script`
  - `toOgmiosAdditionalUtxo(utxos: UTxO[]): unknown[]`

- [ ] **Step 1: Write failing tests**

`test/mappers.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  toLucidDelegation,
  toLucidEvalRedeemers,
  toLucidProtocolParameters,
  toLucidScript,
  toLucidUtxoFromAddressUtxo,
  toLucidUtxoFromOutRefUtxo,
  toOgmiosAdditionalUtxo,
} from "../src/lucid/mappers.js";
import type { NexusAddressUtxo, NexusOutRefUtxo, NexusProtocolParams } from "../src/types.js";

const addressUtxo: NexusAddressUtxo = {
  txHash: "a".repeat(64),
  txIndex: 1,
  address: "addr_test1qz",
  value: "2000000",
  assets: [
    { unit: "b".repeat(56) + "474552", quantity: "5", policyId: "b".repeat(56), assetName: "474552" },
  ],
  datumHash: "c".repeat(64),
};

describe("toLucidUtxoFromAddressUtxo", () => {
  it("maps outref, lovelace, native assets, datumHash", () => {
    const utxo = toLucidUtxoFromAddressUtxo(addressUtxo);
    expect(utxo).toEqual({
      txHash: "a".repeat(64),
      outputIndex: 1,
      address: "addr_test1qz",
      assets: { lovelace: 2000000n, ["b".repeat(56) + "474552"]: 5n },
      datumHash: "c".repeat(64),
      datum: null,
      scriptRef: null,
    });
  });

  it("prefers inline datum bytes and maps reference script", () => {
    const utxo = toLucidUtxoFromAddressUtxo({
      ...addressUtxo,
      datumHash: undefined,
      inlineDatum: { bytes: "d87980" },
      referenceScript: { type: "plutusV2", bytes: "490100" },
    });
    expect(utxo.datum).toBe("d87980");
    expect(utxo.datumHash).toBeNull();
    expect(utxo.scriptRef).toEqual({ type: "PlutusV2", script: "490100" });
  });
});

describe("toLucidUtxoFromOutRefUtxo", () => {
  it("maps the transaction-model UTxO shape", () => {
    const dto: NexusOutRefUtxo = {
      txHash: "e".repeat(64),
      outputIndex: 0,
      address: "addr_test1qq",
      amount: [
        { unit: "lovelace", quantity: "1500000" },
        { unit: "f".repeat(56) + "41", quantity: "2" },
      ],
      dataHash: "1".repeat(64),
      inlineDatum: "d87980",
      scriptRef: "490100",
    };
    const utxo = toLucidUtxoFromOutRefUtxo(dto);
    expect(utxo.assets).toEqual({ lovelace: 1500000n, ["f".repeat(56) + "41"]: 2n });
    expect(utxo.datum).toBe("d87980");
    // scriptRef type is unknown in this DTO — mapper defaults to PlutusV2 CBOR wrapper.
    expect(utxo.scriptRef).toEqual({ type: "PlutusV2", script: "490100" });
  });
});

describe("toLucidProtocolParameters", () => {
  it("maps the flat Nexus params to lucid ProtocolParameters", () => {
    const dto: NexusProtocolParams = {
      minFeeA: 44,
      minFeeB: 155381,
      maxTxSize: 16384,
      maxValSize: "5000",
      keyDeposit: "2000000",
      poolDeposit: "500000000",
      drepDeposit: "500000000",
      govActionDeposit: "100000000000",
      priceMem: 0.0577,
      priceStep: 0.0000721,
      maxTxExMem: "14000000",
      maxTxExSteps: "10000000000",
      coinsPerUtxoSize: "4310",
      collateralPercent: 150,
      maxCollateralInputs: 3,
      minFeeRefScriptCostPerByte: 15,
      costModels: { PlutusV1: { "0": 100, "1": 200 }, PlutusV2: { "0": 1 }, PlutusV3: { "0": 2 } },
    };
    const params = toLucidProtocolParameters(dto);
    expect(params.minFeeA).toBe(44);
    expect(params.keyDeposit).toBe(2000000n);
    expect(params.maxTxExMem).toBe(14000000n);
    expect(params.coinsPerUtxoByte).toBe(4310n);
    expect(params.collateralPercentage).toBe(150);
    expect(params.costModels.PlutusV1).toEqual([100, 200]);
  });
});

describe("toLucidDelegation", () => {
  it("maps poolId and withdrawable rewards", () => {
    expect(
      toLucidDelegation({ poolId: "pool1abc", withdrawableAmount: "123" }),
    ).toEqual({ poolId: "pool1abc", rewards: 123n });
  });
  it("handles undelegated accounts", () => {
    expect(toLucidDelegation({})).toEqual({ poolId: null, rewards: 0n });
  });
});

describe("toLucidEvalRedeemers", () => {
  it("maps tags and exunits", () => {
    expect(
      toLucidEvalRedeemers([
        { redeemerTag: "SPEND", index: 0, exUnits: { mem: 10, steps: 100 } },
        { redeemerTag: "certificate", index: 1, exUnits: { mem: 1, steps: 2 } },
      ]),
    ).toEqual([
      { redeemer_tag: "spend", redeemer_index: 0, ex_units: { mem: 10, steps: 100 } },
      { redeemer_tag: "publish", redeemer_index: 1, ex_units: { mem: 1, steps: 2 } },
    ]);
  });
});

describe("toLucidScript", () => {
  it.each([
    ["plutusV1", "PlutusV1"],
    ["PLUTUS_V2", "PlutusV2"],
    ["plutus:v3", "PlutusV3"],
    ["native", "Native"],
    ["timelock", "Native"],
  ])("normalizes %s -> %s", (input, expected) => {
    expect(toLucidScript(input, "aa").type).toBe(expected);
  });
});

describe("toOgmiosAdditionalUtxo", () => {
  it("converts lucid UTxOs to Ogmios v6 additionalUtxo entries", () => {
    const entries = toOgmiosAdditionalUtxo([
      {
        txHash: "a".repeat(64),
        outputIndex: 2,
        address: "addr_test1qz",
        assets: { lovelace: 5000000n, ["b".repeat(56) + "474552"]: 7n },
        datum: "d87980",
      },
    ]);
    expect(entries).toEqual([
      {
        transaction: { id: "a".repeat(64) },
        index: 2,
        address: "addr_test1qz",
        value: { ada: { lovelace: 5000000n }, ["b".repeat(56)]: { "474552": 7n } },
        datum: "d87980",
      },
    ]);
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test`
Expected: FAIL — mappers unresolved.

- [ ] **Step 3: Implement**

`src/lucid/mappers.ts`:
```ts
import type {
  Assets,
  Delegation,
  EvalRedeemer,
  ProtocolParameters,
  RedeemerTag,
  Script,
  UTxO,
} from "@lucid-evolution/core-types";
import type {
  NexusAccountInfo,
  NexusAddressUtxo,
  NexusOutRefUtxo,
  NexusProtocolParams,
  NexusRedeemerEval,
} from "../types.js";

function assetsFromAddressUtxo(dto: NexusAddressUtxo): Assets {
  const assets: Assets = { lovelace: BigInt(dto.value) };
  for (const asset of dto.assets ?? []) {
    assets[asset.unit] = BigInt(asset.quantity);
  }
  return assets;
}

export function toLucidScript(type: string | undefined, cborHex: string): Script {
  const normalized = (type ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.includes("v1")) return { type: "PlutusV1", script: cborHex };
  if (normalized.includes("v3")) return { type: "PlutusV3", script: cborHex };
  if (normalized.includes("native") || normalized.includes("timelock")) {
    return { type: "Native", script: cborHex };
  }
  return { type: "PlutusV2", script: cborHex };
}

export function toLucidUtxoFromAddressUtxo(dto: NexusAddressUtxo): UTxO {
  const inlineDatum = dto.inlineDatum?.bytes ?? null;
  return {
    txHash: dto.txHash,
    outputIndex: dto.txIndex,
    address: dto.address,
    assets: assetsFromAddressUtxo(dto),
    datumHash: inlineDatum ? null : (dto.datumHash ?? null),
    datum: inlineDatum,
    scriptRef: dto.referenceScript?.bytes
      ? toLucidScript(dto.referenceScript.type, dto.referenceScript.bytes)
      : null,
  };
}

export function toLucidUtxoFromOutRefUtxo(dto: NexusOutRefUtxo): UTxO {
  const assets: Assets = { lovelace: 0n };
  for (const amount of dto.amount ?? []) {
    if (amount.unit === "lovelace") assets.lovelace = BigInt(amount.quantity);
    else assets[amount.unit] = BigInt(amount.quantity);
  }
  if (assets.lovelace === 0n && dto.lovelaceAmount != null) {
    assets.lovelace = BigInt(dto.lovelaceAmount);
  }
  const inlineDatum = dto.inlineDatum ?? null;
  return {
    txHash: dto.txHash,
    outputIndex: dto.outputIndex,
    address: dto.address,
    assets,
    datumHash: inlineDatum ? null : (dto.dataHash ?? null),
    datum: inlineDatum,
    // UtxoDto carries no script type — PlutusV2 is the dominant on-chain case.
    scriptRef: dto.scriptRef ? toLucidScript(undefined, dto.scriptRef) : null,
  };
}

function costModelToArray(model: Record<string, number>): number[] {
  return Object.keys(model)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => model[key]!);
}

export function toLucidProtocolParameters(dto: NexusProtocolParams): ProtocolParameters {
  const costModels: Record<string, number[]> = {};
  for (const [version, model] of Object.entries(dto.costModels ?? {})) {
    costModels[version] = costModelToArray(model);
  }
  return {
    protocolMajorVersion: dto.protocolMajorVer,
    protocolMinorVersion: dto.protocolMinorVer,
    minFeeA: dto.minFeeA,
    minFeeB: dto.minFeeB,
    maxTxSize: dto.maxTxSize,
    maxValSize: Number(dto.maxValSize),
    keyDeposit: BigInt(dto.keyDeposit),
    poolDeposit: BigInt(dto.poolDeposit),
    drepDeposit: BigInt(dto.drepDeposit ?? 0),
    govActionDeposit: BigInt(dto.govActionDeposit ?? 0),
    priceMem: dto.priceMem,
    priceStep: dto.priceStep,
    maxTxExMem: BigInt(dto.maxTxExMem),
    maxTxExSteps: BigInt(dto.maxTxExSteps),
    coinsPerUtxoByte: BigInt(dto.coinsPerUtxoSize),
    collateralPercentage: dto.collateralPercent,
    maxCollateralInputs: dto.maxCollateralInputs,
    minFeeRefScriptCostPerByte: dto.minFeeRefScriptCostPerByte ?? 0,
    costModels: costModels as ProtocolParameters["costModels"],
  };
}

export function toLucidDelegation(dto: NexusAccountInfo): Delegation {
  return {
    poolId: dto.poolId ?? null,
    rewards: BigInt(dto.withdrawableAmount ?? 0),
  };
}

const REDEEMER_TAGS: Record<string, RedeemerTag> = {
  spend: "spend",
  mint: "mint",
  publish: "publish",
  certificate: "publish",
  cert: "publish",
  withdraw: "withdraw",
  withdrawal: "withdraw",
  reward: "withdraw",
  vote: "vote",
  voting: "vote",
  propose: "propose",
  proposing: "propose",
};

export function toLucidEvalRedeemers(dtos: NexusRedeemerEval[]): EvalRedeemer[] {
  return dtos.map((dto) => {
    const tag = REDEEMER_TAGS[dto.redeemerTag.toLowerCase()];
    if (!tag) throw new Error(`Unknown redeemer tag from Nexus: ${dto.redeemerTag}`);
    return {
      redeemer_tag: tag,
      redeemer_index: dto.index,
      ex_units: { mem: dto.exUnits.mem, steps: dto.exUnits.steps },
    };
  });
}

/** Convert lucid UTxOs to Ogmios v6 `additionalUtxo` entries (passed through by Nexus). */
export function toOgmiosAdditionalUtxo(utxos: UTxO[]): unknown[] {
  return utxos.map((utxo) => {
    const value: Record<string, Record<string, bigint>> = {
      ada: { lovelace: utxo.assets.lovelace ?? 0n },
    };
    for (const [unit, quantity] of Object.entries(utxo.assets)) {
      if (unit === "lovelace") continue;
      const policyId = unit.slice(0, 56);
      const assetName = unit.slice(56);
      (value[policyId] ??= {})[assetName] = quantity;
    }
    const entry: Record<string, unknown> = {
      transaction: { id: utxo.txHash },
      index: utxo.outputIndex,
      address: utxo.address,
      value,
    };
    if (utxo.datumHash) entry.datumHash = utxo.datumHash;
    if (utxo.datum) entry.datum = utxo.datum;
    if (utxo.scriptRef) {
      entry.script = {
        language: utxo.scriptRef.type === "Native" ? "native" : utxo.scriptRef.type.toLowerCase().replace("plutusv", "plutus:v"),
        cbor: utxo.scriptRef.script,
      };
    }
    return entry;
  });
}
```

Note: `JSON.stringify` cannot serialize `bigint` — the Ogmios entries contain `bigint` quantities. Task 6 Step 3 handles this at the client boundary by converting the additionalUtxoSet with a bigint-safe replacer BEFORE passing to `client.post`. Keep the mapper returning `bigint` (test asserts it); the provider serializes with `JSON.parse(JSON.stringify(entries, (_, v) => typeof v === "bigint" ? v.toString() : v))` — Ogmios accepts numeric strings? NO — Ogmios requires numbers. Convert instead with `Number(quantity)` guarded by `Number.isSafeInteger`; if unsafe, fall back to string. Implement helper `ogmiosSafeNumber(q: bigint): number | string` in mappers and use it for every quantity. Update the test expectation accordingly: quantities in entries are `number` (`5000000`, `7`).

- [ ] **Step 4: Reconcile bigint decision**

Apply the note above: in `toOgmiosAdditionalUtxo`, emit `ogmiosSafeNumber(quantity)`:
```ts
function ogmiosSafeNumber(quantity: bigint): number | string {
  return quantity <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(quantity) : quantity.toString();
}
```
And in `test/mappers.test.ts` the `toOgmiosAdditionalUtxo` expectation uses numbers:
```ts
value: { ada: { lovelace: 5000000 }, ["b".repeat(56)]: { "474552": 7 } },
```

- [ ] **Step 5: Run gates**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: lucid mappers for utxos, params, delegation, redeemers"
```

---

### Task 5: Fixture check against live preprod (recording script)

**Files:**
- Create: `scripts/capture-fixtures.mjs`, `test/fixtures/README.md`

**Interfaces:**
- Consumes: built `NexusClient` (via `npm run build` output) or plain fetch.
- Produces: `test/fixtures/*.json` real response captures used to eyeball-verify DTO types. Not consumed by automated tests (fixtures may drift); mapper tests keep inline literals.

- [ ] **Step 1: Write the capture script**

`scripts/capture-fixtures.mjs`:
```js
// Usage: NEXUS_API_KEY=... [NEXUS_BASE_URL=...] [NEXUS_NETWORK=PREPROD] \
//        node scripts/capture-fixtures.mjs addr_test1... stake_test1...
import { mkdir, writeFile } from "node:fs/promises";

const API_KEY = process.env.NEXUS_API_KEY;
const BASE_URL = process.env.NEXUS_BASE_URL ?? "https://nexus.gerowallet.io";
const NETWORK = process.env.NEXUS_NETWORK ?? "PREPROD";
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
```

`test/fixtures/README.md`:
```markdown
# Fixtures

Captured from Nexus preprod with `scripts/capture-fixtures.mjs`. Reference material for
verifying the DTO types in `src/types.ts` — not loaded by automated tests.
```

- [ ] **Step 2: Run capture against preprod**

Run: `NEXUS_API_KEY=<key from user or nexus dev config> node scripts/capture-fixtures.mjs <funded preprod addr> <its stake addr>`
Expected: three fixture files, HTTP 200 each. **Compare each fixture's fields against `src/types.ts` and the mappers; fix any mismatched field name/type found, updating tests.** If no API key is available at execution time, note the skip in the commit message and continue — the shapes were sourced from the Java DTOs.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "test: fixture capture script + preprod response captures"
```

---

### Task 6: NexusProvider

**Files:**
- Create: `src/lucid/provider.ts`
- Modify: `src/lucid/index.ts`
- Test: `test/provider.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–4.
- Produces:
  - `type LucidNetwork = "Mainnet" | "Preprod" | "Preview"`
  - `interface NexusProviderOptions { apiKey: string; network: LucidNetwork; baseUrl?: string; timeoutMs?: number }`
  - `class NexusProvider implements Provider` (from `@lucid-evolution/core-types`), plus `readonly client: NexusClient` for escape-hatch access.

- [ ] **Step 1: Write failing tests**

`test/provider.test.ts`:
```ts
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
    expect(String(spy.mock.calls[0]![0])).toContain("network=PREPROD");
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
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test`
Expected: FAIL — provider unresolved.

- [ ] **Step 3: Implement**

`src/lucid/provider.ts`:
```ts
import type {
  Address,
  Credential,
  Datum,
  DatumHash,
  Delegation,
  EvalRedeemer,
  OutRef,
  ProtocolParameters,
  Provider,
  RewardAddress,
  Transaction,
  TxHash,
  Unit,
  UTxO,
} from "@lucid-evolution/core-types";
import { NexusClient, type NexusNetwork } from "../client.js";
import { getAccountInfo } from "../endpoints/account.js";
import {
  getAddressUtxos,
  getAddressUtxosWithAsset,
  getCredentialUtxos,
} from "../endpoints/addresses.js";
import { getAssetUtxos } from "../endpoints/assets.js";
import { getProtocolParams } from "../endpoints/epoch.js";
import { getDatum } from "../endpoints/scripts.js";
import {
  evaluateTx,
  getTransaction,
  getUtxosByOutRefs,
  submitTx,
} from "../endpoints/transactions.js";
import type { NexusAddressUtxo } from "../types.js";
import {
  toLucidDelegation,
  toLucidEvalRedeemers,
  toLucidProtocolParameters,
  toLucidUtxoFromAddressUtxo,
  toLucidUtxoFromOutRefUtxo,
  toOgmiosAdditionalUtxo,
} from "./mappers.js";

export type LucidNetwork = "Mainnet" | "Preprod" | "Preview";

export interface NexusProviderOptions {
  apiKey: string;
  network: LucidNetwork;
  baseUrl?: string;
  timeoutMs?: number;
}

const NETWORK_MAP: Record<LucidNetwork, NexusNetwork> = {
  Mainnet: "MAINNET",
  Preprod: "PREPROD",
  Preview: "PREVIEW",
};

const PAGE_SIZE = 100;

export class NexusProvider implements Provider {
  readonly client: NexusClient;

  constructor(options: NexusProviderOptions) {
    this.client = new NexusClient({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      network: NETWORK_MAP[options.network],
      timeoutMs: options.timeoutMs,
    });
  }

  private async paginate(
    fetchPage: (page: number) => Promise<NexusAddressUtxo[]>,
  ): Promise<UTxO[]> {
    const all: NexusAddressUtxo[] = [];
    for (let page = 1; ; page++) {
      const batch = await fetchPage(page);
      all.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return all.map(toLucidUtxoFromAddressUtxo);
  }

  async getProtocolParameters(): Promise<ProtocolParameters> {
    return toLucidProtocolParameters(await getProtocolParams(this.client));
  }

  async getUtxos(addressOrCredential: Address | Credential): Promise<UTxO[]> {
    if (typeof addressOrCredential === "string") {
      return this.paginate((page) =>
        getAddressUtxos(this.client, addressOrCredential, page, PAGE_SIZE),
      );
    }
    return this.paginate((page) =>
      getCredentialUtxos(this.client, addressOrCredential.hash, page, PAGE_SIZE),
    );
  }

  async getUtxosWithUnit(
    addressOrCredential: Address | Credential,
    unit: Unit,
  ): Promise<UTxO[]> {
    if (typeof addressOrCredential === "string") {
      return this.paginate((page) =>
        getAddressUtxosWithAsset(this.client, addressOrCredential, unit, page, PAGE_SIZE),
      );
    }
    // Nexus has no credential+asset endpoint; filter the credential's utxos client-side.
    const utxos = await this.getUtxos(addressOrCredential);
    return utxos.filter((utxo) => utxo.assets[unit] !== undefined);
  }

  async getUtxoByUnit(unit: Unit): Promise<UTxO> {
    const dtos = await getAssetUtxos(this.client, unit, 1, 2);
    const unspent = dtos.filter((dto) => dto.spent !== true);
    if (unspent.length === 0) throw new Error(`UTxO with unit ${unit} not found`);
    if (unspent.length > 1) throw new Error(`Unit ${unit} is held in more than one UTxO`);
    return toLucidUtxoFromAddressUtxo(unspent[0]!);
  }

  async getUtxosByOutRef(outRefs: OutRef[]): Promise<UTxO[]> {
    const dtos = await getUtxosByOutRefs(
      this.client,
      outRefs.map((ref) => ({ txHash: ref.txHash, outputIndex: ref.outputIndex })),
    );
    return dtos.map(toLucidUtxoFromOutRefUtxo);
  }

  async getDelegation(rewardAddress: RewardAddress): Promise<Delegation> {
    return toLucidDelegation(await getAccountInfo(this.client, rewardAddress));
  }

  async getDatum(datumHash: DatumHash): Promise<Datum> {
    const datum = await getDatum(this.client, datumHash);
    if (!datum.cbor) throw new Error(`Datum ${datumHash} not found`);
    return datum.cbor;
  }

  async awaitTx(txHash: TxHash, checkInterval = 3000): Promise<boolean> {
    for (;;) {
      const tx = await getTransaction(this.client, txHash).catch(() => null);
      if (tx !== null) return true;
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
  }

  async submitTx(tx: Transaction): Promise<TxHash> {
    return submitTx(this.client, tx);
  }

  async evaluateTx(tx: Transaction, additionalUTxOs?: UTxO[]): Promise<EvalRedeemer[]> {
    const additional = additionalUTxOs?.length
      ? toOgmiosAdditionalUtxo(additionalUTxOs)
      : undefined;
    return toLucidEvalRedeemers(await evaluateTx(this.client, tx, additional));
  }
}
```

`src/lucid/index.ts`:
```ts
export { NexusProvider } from "./provider.js";
export type { LucidNetwork, NexusProviderOptions } from "./provider.js";
export * from "./mappers.js";
```

Note on `Provider` conformance: `getTransactionStatus`, `getUtxosWithPolicy`, `getTreasury`, `getRewardAccount` are optional interface members — omitting them is valid. `npm run typecheck` is the arbiter; if the installed `@lucid-evolution/core-types` version marks any of them required, implement them by the same pattern (`getUtxosWithPolicy` = client-side filter on `unit.startsWith(policyId)`).

- [ ] **Step 4: Run gates**

Run: `npm test && npm run lint && npm run typecheck && npm run build`
Expected: PASS; build emits both entries.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: NexusProvider implementing lucid-evolution Provider"
```

---

### Task 7: Env-gated integration test + README

**Files:**
- Create: `test/integration.test.ts`, `README.md`

**Interfaces:**
- Consumes: `NexusProvider` from Task 6.
- Produces: live smoke coverage (`NEXUS_API_KEY` gated); public-facing README.

- [ ] **Step 1: Write integration test**

`test/integration.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { NexusProvider } from "../src/lucid/provider.js";

const apiKey = process.env.NEXUS_API_KEY;
const address = process.env.NEXUS_TEST_ADDRESS;
const stakeAddress = process.env.NEXUS_TEST_STAKE_ADDRESS;

describe.skipIf(!apiKey)("integration (preprod)", () => {
  const provider = new NexusProvider({
    apiKey: apiKey!,
    network: "Preprod",
    baseUrl: process.env.NEXUS_BASE_URL,
  });

  it("fetches protocol parameters", async () => {
    const params = await provider.getProtocolParameters();
    expect(params.minFeeA).toBeGreaterThan(0);
    expect(params.keyDeposit).toBeGreaterThan(0n);
    expect(Object.keys(params.costModels)).toContain("PlutusV2");
  });

  it.skipIf(!address)("fetches utxos for the test address", async () => {
    const utxos = await provider.getUtxos(address!);
    expect(Array.isArray(utxos)).toBe(true);
    for (const utxo of utxos) {
      expect(typeof utxo.assets.lovelace).toBe("bigint");
      expect(utxo.txHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it.skipIf(!stakeAddress)("fetches delegation", async () => {
    const delegation = await provider.getDelegation(stakeAddress!);
    expect(typeof delegation.rewards).toBe("bigint");
  });
}, 60_000);
```

- [ ] **Step 2: Run both modes**

Run: `npm test` (no env) — integration suite reports skipped, all unit tests pass.
Run: `NEXUS_API_KEY=<key> NEXUS_TEST_ADDRESS=<addr> NEXUS_TEST_STAKE_ADDRESS=<stake> npm test` — integration passes against preprod. If no key available at execution time, run the skipped mode only and say so in the final report.

- [ ] **Step 3: Write README**

`README.md`:
````markdown
# @adlabs/nexus

TypeScript SDK for the [Nexus](https://nexus.gerowallet.io) Cardano API: a typed REST
client plus a [lucid-evolution](https://github.com/Anastasia-Labs/lucid-evolution)
provider.

## Install

```bash
npm install @adlabs/nexus @lucid-evolution/lucid
```

## Use with lucid-evolution

```typescript
import { Lucid } from "@lucid-evolution/lucid";
import { NexusProvider } from "@adlabs/nexus/lucid";

const lucid = await Lucid(
  new NexusProvider({ apiKey: process.env.NEXUS_API_KEY!, network: "Preprod" }),
  "Preprod",
);
```

## Use the raw client

```typescript
import { NexusClient, getAddressUtxos } from "@adlabs/nexus";

const client = new NexusClient({ apiKey: process.env.NEXUS_API_KEY!, network: "PREPROD" });
const utxos = await getAddressUtxos(client, "addr_test1...", 1, 100);
```

## Options

| Option | Default | Notes |
|---|---|---|
| `apiKey` | — | Nexus API key (`X-Api-Key`) |
| `network` | key's scoped network | `Mainnet` / `Preprod` / `Preview` (provider) or `MAINNET`… (client) |
| `baseUrl` | `https://nexus.gerowallet.io` | self-hosted Nexus deployments |
| `timeoutMs` | `30000` | per-request timeout |

## Development

```bash
npm install
npm test          # unit tests
npm run build     # ESM + CJS + d.ts
NEXUS_API_KEY=... npm test   # + live preprod integration tests
```
````

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test: env-gated preprod integration suite; docs: README"
```

---

### Task 8: CI + spec correction + push

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `docs/specs/2026-07-21-nexus-sdk-lucid-provider-design.md` (datum endpoint path)

**Interfaces:**
- Consumes: npm scripts from Task 1.
- Produces: green CI on push/PR to `main`.

- [ ] **Step 1: Write workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Fix spec datum path**

In `docs/specs/2026-07-21-nexus-sdk-lucid-provider-design.md`, replace the `getDatum` row's endpoint `GET /api/addresses/datum/{datumHash}` with `GET /api/scripts/datum/{datumHash}` (verified location), and in the endpoints/ tree description note `scripts.ts # script by hash, datum by hash`.

- [ ] **Step 3: Commit and push**

```bash
git add -A && git commit -m "ci: lint+typecheck+test+build workflow; docs: fix datum endpoint path in spec"
git push origin main
```

- [ ] **Step 4: Verify CI green**

Run: `gh run watch --repo Gero-Labs/nexus-sdk --exit-status $(gh run list --repo Gero-Labs/nexus-sdk --limit 1 --json databaseId -q '.[0].databaseId')`
Expected: workflow concludes `success`.

---

## Deferred (explicitly out of this plan)

- npm publish + changesets (repo private; publish flow added when going public).
- Full lucid round-trip test (build+sign+submit self-send) — manual/nightly, needs funded preprod wallet secret in CI.
- `getTransactionStatus` / `getRewardAccount` optional Provider methods.
