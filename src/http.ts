import type { paths } from "./generated/schema.js";

// Extract the JSON-ish payload from an OpenAPI response/requestBody node. Springdoc emits
// "application/json" for typed DTOs, but falls back to the catch-all media type for many
// handlers and "text/plain" for raw bodies — accept all three so types don't degrade to
// unknown.
type JsonOf<T> = T extends { content: infer C }
  ? C extends { "application/json": infer R }
    ? R
    : C extends { "*/*": infer R }
      ? R
      : C extends { "text/plain": infer R }
        ? R
        : unknown
  : unknown;

type SuccessResponse<R> = R extends { 200: infer T }
  ? T
  : R extends { 201: infer T }
    ? T
    : R extends { 202: infer T }
      ? T
      : unknown;

/** JSON response type of `GET P`, resolved from the generated schema. */
export type GetJson<P extends keyof paths> = paths[P] extends {
  get: { responses: infer R };
}
  ? JsonOf<SuccessResponse<R>>
  : unknown;

/** JSON response type of `POST P`. */
export type PostJson<P extends keyof paths> = paths[P] extends {
  post: { responses: infer R };
}
  ? JsonOf<SuccessResponse<R>>
  : unknown;

/** JSON response type of `DELETE P`. */
export type DeleteJson<P extends keyof paths> = paths[P] extends {
  delete: { responses: infer R };
}
  ? JsonOf<SuccessResponse<R>>
  : unknown;

/** JSON request body type of `POST P`. */
export type PostBody<P extends keyof paths> = paths[P] extends {
  post: { requestBody: { content: { "application/json": infer B } } };
}
  ? B
  : unknown;

/** Standard pagination options for list endpoints. */
export interface PageOptions {
  page?: number;
  pageSize?: number;
}

/** Build a `{ page, pageSize }` query with the SDK defaults (page 1, size 100). */
export function pageQuery(opts?: PageOptions): { page: number; pageSize: number } {
  return { page: opts?.page ?? 1, pageSize: opts?.pageSize ?? 100 };
}
