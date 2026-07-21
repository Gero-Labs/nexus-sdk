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
