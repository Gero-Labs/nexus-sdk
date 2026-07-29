export { NexusClient } from "./client.js";
export type { NexusClientOptions, NexusNetwork } from "./client.js";
export { NexusApiError, NexusUsageError } from "./errors.js";
export type { PageOptions } from "./http.js";

export type { CardanoNamespace } from "./namespaces/cardano.js";
export type { BitcoinNamespace } from "./namespaces/bitcoin.js";
export type { MidnightNamespace } from "./namespaces/midnight.js";

// Generated OpenAPI types. DTO shapes are under `components["schemas"][...]`; per-operation
// request/response types under `operations`/`paths`. Regenerate with `npm run gen:types`.
export type { components, operations, paths } from "./generated/schema.js";

// Retained wire-verified hand-written types (also used by the /lucid provider).
export * from "./types.js";
