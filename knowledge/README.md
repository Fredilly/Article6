# Article6 Knowledge Store

GitHub is the temporary durable store for Article6 commercial knowledge while Neon writes are unavailable.

## Record format

Each record is one JSON file under `knowledge/records/` and must include:

- `id`: stable unique identifier
- `kind`: `organization`, `contact`, `tender`, `project`, `interaction`, `research`, `sales_rule`, `product_rule`, `objection`, `experiment`, `outcome`, or `document`
- `title`: short human-readable label
- `content`: the source text or durable summary
- `source.type`: where the knowledge came from, for example `gmail`, `chat`, `ted`, `website`, `crm`, or `manual`
- `source.ref`: original message ID, URL, file name, or other provenance reference when available
- `occurredAt`: when the underlying event happened, when known
- `capturedAt`: when the record was added
- `certainty`: `CONFIRMED`, `PROBABLE`, `INFERRED`, `UNVERIFIED`, or `STALE`
- `links`: entity IDs such as `organizationId`, `contactId`, `tenderId`, or `projectId`
- `tags`: searchable labels

Original source material should be preserved outside the normalized record whenever possible. Do not turn inferred bidder status into confirmed bidder status.

## Commands

```bash
npm run knowledge:ingest -- path/to/input.json
npm run knowledge:search -- "search terms"
npm run knowledge:check
```

`knowledge:ingest` validates and writes a normalized record into `knowledge/records/`.

`knowledge:search` performs local hybrid-style lexical search across metadata and content. It is intentionally dependency-free so the GitHub store works without Neon or an external vector database.

When Neon is available again, these records can be synchronized into Postgres and embedded without changing the durable GitHub format.
