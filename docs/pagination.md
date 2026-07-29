# Pagination

Most list endpoints accept a trailing options object. The common shape is:

```ts
interface PageOptions {
  page?: number;      // default 1
  pageSize?: number;  // default 100
}
```

```ts
// defaults to ?page=1&pageSize=100
await nexus.cardano.addresses.utxos("addr1...");

// explicit page
await nexus.cardano.addresses.utxos("addr1...", { page: 3, pageSize: 50 });
```

## Endpoint-specific parameters

Some endpoints extend the options object with their own filters, and a few market/DEX
endpoints use different parameter names (`size` instead of `pageSize`, or `limit`/`offset`).
The method signature always reflects the real API parameters — pass what the type accepts:

```ts
// extra filters alongside pagination
await nexus.cardano.dreps.list({ status: "active", sort: "votingPower", page: 1, pageSize: 20 });

// limit/offset
await nexus.cardano.market.leaderboard.list({ limit: 50, offset: 0 });

// page + size (note: `size`, not `pageSize`)
await nexus.cardano.market.blueprints.events(id, { page: 1, size: 100 });
```

`undefined` option values are omitted from the request, so you only set what you need. See the
[API reference](./README.md#api-reference) for each method's exact parameters.
