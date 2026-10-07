CREATE DATABASE IF NOT EXISTS agentlens;

CREATE TABLE IF NOT EXISTS agentlens.trace_spans
(
    trace_id           String,
    project_id         String,
    agent_name         LowCardinality(String),
    session_id         String,
    user_id            String,
    span_id            String,
    parent_span_id     String,
    span_name          LowCardinality(String),
    span_kind          LowCardinality(String),
    status             LowCardinality(String),
    started_at         DateTime64(3, 'UTC'),
    ended_at           DateTime64(3, 'UTC'),
    model              LowCardinality(String),
    tool_name          LowCardinality(String),
    prompt_tokens      UInt64,
    completion_tokens  UInt64,
    cost_usd           Float64,
    input_json         String CODEC(ZSTD(3)),
    output_json        String CODEC(ZSTD(3)),
    error_message      String CODEC(ZSTD(3)),
    ingested_at        DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(started_at)
ORDER BY (project_id, started_at, trace_id, span_id)
TTL started_at + INTERVAL 90 DAY DELETE;
