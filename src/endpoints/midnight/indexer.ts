import type { NexusClient } from "../../client.js";
import type { PostBody, PostJson } from "../../http.js";

const enc = encodeURIComponent;

/** POST /api/midnight/{network}/indexer/graphql — forward a GraphQL query to the Midnight indexer. */
export function forwardGraphQL(
  client: NexusClient,
  network: string,
  body: PostBody<"/api/midnight/{network}/indexer/graphql">,
): Promise<PostJson<"/api/midnight/{network}/indexer/graphql">> {
  return client.post(`/api/midnight/${enc(network)}/indexer/graphql`, body);
}

/** Namespace fragment: `client.midnight.indexer.*`. */
export function bindIndexer(client: NexusClient) {
  return {
    graphql: (
      network: string,
      body: PostBody<"/api/midnight/{network}/indexer/graphql">,
    ) => forwardGraphQL(client, network, body),
  } as const;
}
