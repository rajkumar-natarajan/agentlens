# AgentLens architecture and MVP plan

**Product:** AgentLens

**Tagline:** See everything your AI agents do. Control everything they can do.

**Positioning:** Observability • Evaluation • Governance for production AI agents

## 1. High-level architecture

```text
 ┌────────────────────────────────────── Agent runtime ───────────────────────────────────────┐
 │ Python SDK │ TypeScript SDK │ OpenTelemetry bridge │ LangGraph/CrewAI/etc. adapters        │
 └────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                              │ OTLP/custom trace batches
                                              ▼
 ┌────────────────────────────── Edge / Ingestion API ────────────────────────────────────────┐
 │ TLS · API-key authentication · payload validation · batch/size caps · gateway rate limits │
 └──────────────────────────────┬─────────────────────────────────────────────────────────────┘
                                │ authenticated, bounded JSONEachRow writes
                                ▼
 ┌────────────────────────────────── Event transport ────────────────────────────────────────┐
 │ MVP: synchronous ClickHouse insert │ Scale: Kafka/Redpanda + retry/DLQ + consumer workers  │
 └────────────────┬────────────────────────────────────────────────┬─────────────────────────┘
                  │                                                  │
                  ▼                                                  ▼
 ┌────────────────────────────┐                       ┌───────────────────────────────────────┐
 │ ClickHouse                 │                       │ PostgreSQL + Prisma                  │
 │ spans, generations, costs,  │                       │ orgs, memberships, projects, agents,  │
 │ eval events, aggregates    │                       │ versions, policies, API keys, scores │
 └──────────────┬─────────────┘                       └──────────────────┬────────────────────┘
                │                                                        │
                └──────────────────────┬─────────────────────────────────┘
                                       ▼
 ┌────────────────────────────────── Product API ─────────────────────────────────────────────┐
 │ Auth/RBAC · query builder · evaluations · policy decisions · comments · audit events        │
 └──────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                        ▼
 ┌────────────────────────────── Next.js 15 App Router ──────────────────────────────────────┐
 │ Trace explorer/waterfall · sessions · evaluations · cost/latency dashboards · governance   │
 └────────────────────────────────────────────────────────────────────────────────────────────┘

 Redis: distributed quotas, idempotency keys, short-lived query cache, live stream fan-out.
 Object storage: optional large/redacted payload archive with retention and customer-managed keys.
```

### MVP service boundaries

- **Web:** Next.js App Router, TypeScript, Tailwind CSS; dashboard and product API routes.
- **Ingestion:** Node runtime route validates batches, applies configured credential checks, converts span objects to ClickHouse rows, and confirms storage before returning `202`.
- **Trace store:** ClickHouse ordered by project/time/trace for recent-window exploration and analytics.
- **Metadata store:** PostgreSQL/Prisma for relational workspace configuration and access control.
- **Async evolution:** Put a durable Kafka/Redpanda topic between ingress and ClickHouse when throughput and retry isolation require it. Acknowledge only after durable queue publish; consumers write idempotently and route poison batches to a DLQ.

## 2. Folder / monorepo structure

This starter keeps the first deliverable in a single deployable Next.js app; the SDK packages and schemas are independently extractable workspace packages as the product grows.

```text
agentlens/
├── app/
│   ├── api/v1/traces/route.ts     # authenticated trace batch ingestion
│   ├── globals.css               # dark-first responsive design system
│   ├── layout.tsx                # app metadata and root layout
│   └── page.tsx                  # product entry point
├── components/
│   └── AgentLensApp.tsx           # explorer, metrics, filters, trace detail drawer
├── docs/
│   └── architecture.md            # architecture, schemas, SDK strategy, roadmap
├── infra/
│   └── clickhouse/001_trace_spans.sql
├── packages/
│   ├── sdk-python/
│   │   ├── agentlens/__init__.py
│   │   ├── agentlens/client.py
│   │   └── pyproject.toml
│   └── sdk-typescript/
│       ├── package.json
│       └── src/index.ts
├── prisma/
│   └── schema.prisma              # PostgreSQL control-plane metadata
├── .env.example
├── docker-compose.yml
├── next.config.ts
├── package.json
└── README.md
```

## 3. Core data models

### Control plane (Prisma / PostgreSQL)

`prisma/schema.prisma` defines the initial organization, project, user membership, agent/version, policy, and API-key entities. Use a membership role enum for RBAC; never store a raw API secret, only a one-way hash and a short display prefix. Deletion and retention should be explicit, auditable operations.

### Event plane (ClickHouse)

`infra/clickhouse/001_trace_spans.sql` stores flattened spans with project and trace IDs, parent relationships, timestamps, status, model/tool attribution, tokens, cost, payloads, and error detail. Production deployment should partition by month and order by `(project_id, started_at, trace_id, span_id)` to keep recent project-scoped trace queries efficient.

The initial layout keeps raw span writes simple. At higher volume, separate large payloads from hot metadata, use TTL policies and materialized views for minute/hour aggregates, and use a stable ingestion ID for deduplication.

## 4. SDK and instrumentation strategy

The included SDKs expose a small, framework-neutral trace envelope and authenticated batch transport. `packages/sdk-typescript` uses `fetch`; `packages/sdk-python` uses the Python standard library. Both target `POST /api/v1/traces`, flush explicit user-created span data, and surface transport failures to callers.

Recommended SDK progression:

1. Ship explicit `trace()` / `span()` context managers with context propagation, parent IDs, exception capture, bounded async queues, batch flush, shutdown hooks, and configurable sampling.
2. Add OpenTelemetry bridge support. Map OTel `TraceId`/`SpanId`, events, status, and resource attributes; use W3C Trace Context propagation and OTLP-compatible semantic conventions.
3. Provide opt-in adapters for LangGraph, CrewAI, AutoGen, OpenAI Agents SDK, Vercel AI SDK, and LlamaIndex. Capture model/tool inputs only with an explicit payload privacy policy; support redaction before enqueue and payload-size limits.
4. Include retry with exponential backoff + jitter for transient failures, bounded queue/drop counters, idempotency keys, and explicit flush-on-shutdown. Avoid unbounded background queues or silently swallowing errors.

An SDK must not capture chain-of-thought/private hidden reasoning. Record observable inputs/outputs, tool calls, model metadata, and explicit user-authored events; redact PII/secrets according to project policy.

## 5. MVP roadmap

### Phase 1 — Tracing + basic UI (this starter)

- Dark-first trace explorer with seeded demo runs, summary metrics, volume chart, filters/search, table and span/payload drawer.
- Batch ingestion endpoint with schema validation, authentication, request limits and ClickHouse JSONEachRow persistence.
- TypeScript/Python client transport, metadata/event schema starter, setup docs.
- Next: connect query APIs to live data, persist projects/memberships, generate and rotate per-project API keys, add pagination and saved filters.

### Phase 2 — Evaluations + cost

- Evaluator registry (rule/model/custom), versioned evaluation definitions, async execution, scores and confidence.
- Human annotations, rubric management, datasets, regression runs, prompt/model side-by-side comparison.
- Usage normalization/pricing catalog, per-agent/user/model/feature attribution, p50/p95/p99 charts, budget thresholds and anomaly alerts.
- Materialized views and query APIs for daily/monthly trends; separate evaluator workers from ingestion.

### Phase 3 — Guardrails + versioning

- Policy evaluation at the agent integration boundary: tool allow/deny, PII and topic policies, rate and spend limits, and approval gates.
- Immutable decision/audit events, replay against versioned inputs, explainable block/allow reasons and rollback.
- Git-like prompt/agent config versions, diffs, canary cohorts, A/B assignment, automatic rollback on SLO regression.
- RBAC, SSO, audit exports, retention controls, webhooks/Slack/Teams and OTel export.

## 6. Ingestion pipeline and rate limiting

### Request path (implemented synchronous MVP)

1. Terminate TLS at the edge; authenticate the bearer API key.
2. Reject oversized requests (1 MiB), batches over 50 traces, over 500 spans per trace, invalid timestamps, and unknown fields.
3. Convert spans to typed flat rows; serialize with `JSONEachRow`; insert into the configured ClickHouse database/table.
4. Return `202` only after ClickHouse confirms the insert. Return `400` for malformed input, `401` for missing/invalid credentials, `413` for payload limits, `502` for storage failure, or `503` when storage is not configured.
5. Export request latency, accepted/rejected span counts, storage errors and bytes to platform telemetry; never log raw prompts or tool payloads.

### Rate and resource controls

- The application does **not** use a process-local limiter: it is incorrect across serverless instances and restarts. Put a distributed limiter at the ingress gateway before exposing this starter publicly.
- Key quota buckets by API-key ID and project, not source IP alone. Use a Redis token bucket or gateway-native shared quota store; enforce both requests/second and spans/second, with a burst allowance.
- Apply hard max-body, max-batch, max-span, per-key concurrent-write, and ClickHouse query timeout limits. Return `429` with `Retry-After` on quota exhaustion.
- Reserve separate quotas for interactive/query traffic and ingestion; use fair scheduling per tenant and explicit monthly event caps.
- At scale, acknowledge after durable queue publish, then consumer workers bulk-insert; retry transient failures, deduplicate by ingestion ID, and dead-letter invalid or repeatedly failing records. Alert on queue age, dropped spans, ClickHouse insert latency, and quota saturation.

### Security and reliability boundaries

The demo workspace in the UI is static sample data and is not an authenticated tenant UI yet. The ingestion endpoint uses one shared environment secret for this starter; do not treat it as production multi-tenant key management. Before public deployment, use per-project hashed API keys, organization membership/RBAC, secret rotation, gateway rate limits, TLS, tenant scoping, PII redaction, explicit retention, and audited admin operations.
