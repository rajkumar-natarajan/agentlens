# AgentLens

**See everything your AI agents do. Control everything they can do.**

AgentLens is an observability-first workspace for production AI agents. This repository contains the Phase 1 trace explorer UI, a ClickHouse-backed trace ingestion endpoint, minimal TypeScript and Python SDK clients, and the architecture/data-model plan for growing the platform.

## Run locally

Requirements: Node.js 20+, npm, Docker (for ClickHouse-backed ingestion).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The explorer is seeded with realistic sample traces so you can explore the UI without configuring services.

To run trace ingestion locally, start ClickHouse and configure the API:

```bash
docker compose up -d clickhouse
cp .env.example .env.local
# Set AGENTLENS_API_KEY to a long random value in .env.local
npm run dev
```

Create the table once:

```bash
curl 'http://localhost:8123/' --data-binary @infra/clickhouse/001_trace_spans.sql
```

Send an example trace:

```bash
curl -X POST http://localhost:3000/api/v1/traces \
  -H 'Authorization: Bearer replace-with-a-long-random-secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "traceId":"trace-001",
    "projectId":"acme-production",
    "agentName":"support-copilot",
    "startedAt":"2026-03-18T12:42:18.402Z",
    "spans":[{
      "id":"span-001",
      "name":"answer_customer",
      "kind":"llm",
      "startedAt":"2026-03-18T12:42:18.402Z",
      "endedAt":"2026-03-18T12:42:19.102Z",
      "model":"claude-3.5-sonnet",
      "promptTokens":1842,
      "completionTokens":328,
      "costUsd":0.0248,
      "input":{"role":"user","content":"Where is my order?"},
      "output":{"role":"assistant","content":"Your order is on its way."}
    }]
  }'
```

The endpoint requires `AGENTLENS_API_KEY` and `CLICKHOUSE_URL`; it returns `202` only after ClickHouse confirms the write. Invalid payloads, missing auth, and storage failures return explicit non-success responses. It accepts one trace or a batch of up to 50 traces (500 spans each, 1 MiB body limit).

## What is implemented

- Dark-first responsive trace explorer with run volume and cost/latency/error summaries.
- Search across trace IDs, agents, actors, model names, and inputs; filter by agent and status.
- Trace detail drawer with span hierarchy/timing, payload views, token/cost metadata, and evaluation score presentation.
- Typed, authenticated ingestion route writing span rows to ClickHouse.
- Lightweight TypeScript and Python clients for sending traces.
- Prisma metadata schema and ClickHouse trace schema.
- Architecture, data-flow, security/rate-limit guidance, and phased roadmap in [docs/architecture.md](./docs/architecture.md).

The dashboard currently uses sample data intentionally. The ingestion path writes to ClickHouse, but connecting live query results to the dashboard, organization-backed auth, distributed quotas, evaluator execution, and the remaining roadmap features are subsequent implementation phases—not implied by the sample screens.

## Checks

```bash
npm run typecheck
npm run build
```

## Repository map

See [docs/architecture.md](./docs/architecture.md) for the complete folder map, architecture diagram, schema overview, SDK/instrumentation strategy, ingestion and rate-limit design, and roadmap.
