import { NexusApiError } from "./errors.js";
import { type CardanoNamespace, makeCardano } from "./namespaces/cardano.js";
import { type BitcoinNamespace, makeBitcoin } from "./namespaces/bitcoin.js";
import { type MidnightNamespace, makeMidnight } from "./namespaces/midnight.js";

export type NexusNetwork = "CARDANO_MAINNET" | "CARDANO_PREPROD" | "CARDANO_PREVIEW";

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
      typeof (body as { error: unknown }).error === "string" &&
      (body as { error: string }).error.length > 0
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

  /** The network passed at construction, if any. Used by mainnet-only guards (e.g. market data). */
  get networkOption(): NexusNetwork | undefined {
    return this.network;
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
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) await sleep(this.retryDelaysMs[attempt - 1] ?? 0);
      try {
        const res = await fetch(url, {
          ...init,
          headers: { "X-Api-Key": this.apiKey, ...init.headers },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (res.ok) return res;
        if (res.status >= 500 && attempt < attempts - 1) continue;
        throw await errorFromResponse(res);
      } catch (error) {
        if (error instanceof NexusApiError) throw error;
        // Network / timeout error: retry unless this was the last attempt.
        if (attempt >= attempts - 1) break;
      }
    }
    throw new NexusApiError(0, "Nexus request failed: network error or timeout");
  }

  async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const res = await this.request(this.buildUrl(path, query), { method: "GET" }, true);
    return (await res.json()) as T;
  }

  /** GET a path whose response is a bare text/plain body (e.g. raw tx hex). */
  async getText(path: string, query?: Record<string, string | number | undefined>): Promise<string> {
    const res = await this.request(this.buildUrl(path, query), { method: "GET" }, true);
    const text = await res.text();
    return text.trim().replace(/^"|"$/g, "");
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

  /** DELETE a path. Returns the parsed JSON body, or undefined for an empty (204) response. */
  async del<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const res = await this.request(this.buildUrl(path, query), { method: "DELETE" }, false);
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private _cardano?: CardanoNamespace;
  private _bitcoin?: BitcoinNamespace;
  private _midnight?: MidnightNamespace;

  /** Cardano chain + market-data endpoints. */
  get cardano(): CardanoNamespace {
    return (this._cardano ??= makeCardano(this));
  }

  /** Bitcoin endpoints. */
  get bitcoin(): BitcoinNamespace {
    return (this._bitcoin ??= makeBitcoin(this));
  }

  /** Midnight endpoints. */
  get midnight(): MidnightNamespace {
    return (this._midnight ??= makeMidnight(this));
  }
}
