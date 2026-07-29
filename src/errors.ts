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

/**
 * Error thrown for client-side misuse before any request is made — e.g. calling a
 * mainnet-only endpoint with a non-mainnet network, or omitting a required argument.
 * Distinct from {@link NexusApiError}, which always reflects a server response.
 */
export class NexusUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NexusUsageError";
  }
}
