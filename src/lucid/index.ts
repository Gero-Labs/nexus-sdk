/**
 * @deprecated The `@adlabs/nexus/lucid` adapter is deprecated. Use the native Nexus provider
 * that ships with lucid-evolution instead (`new Nexus({ apiKey })`,
 * Anastasia-Labs/lucid-evolution#722). This entry point remains for backward compatibility
 * and will be removed in a future major version.
 *
 * @module
 */
export { NexusProvider } from "./provider.js";
export type { LucidNetwork, NexusProviderOptions } from "./provider.js";
export * from "./mappers.js";
