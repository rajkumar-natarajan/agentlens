import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_048_576;
const spanSchema = z
  .object({
    id: z.string().min(1).max(128),
    parentId: z.string().max(128).optional(),
    name: z.string().min(1).max(256),
    kind: z.enum(["llm", "tool", "chain", "agent", "retrieval"]),
    startedAt: z.string().datetime({ offset: true }),
    endedAt: z.string().datetime({ offset: true }).optional(),
    status: z.enum(["ok", "error"]).default("ok"),
    model: z.string().max(128).optional(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    toolName: z.string().max(128).optional(),
    promptTokens: z.number().int().nonnegative().optional(),
    completionTokens: z.number().int().nonnegative().optional(),
    costUsd: z.number().nonnegative().optional(),
    error: z.string().max(4_000).optional(),
  })
  .strict();

const traceSchema = z
  .object({
    traceId: z.string().min(1).max(128),
    projectId: z.string().min(1).max(128),
    agentName: z.string().min(1).max(128),
    sessionId: z.string().max(128).optional(),
    userId: z.string().max(128).optional(),
    startedAt: z.string().datetime({ offset: true }),
    spans: z.array(spanSchema).min(1).max(500),
  })
  .strict();

const batchSchema = z.array(traceSchema).min(1).max(50);

function unauthorized() {
  return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
}

export async function POST(request: Request) {
  const configuredKey = process.env.AGENTLENS_API_KEY;
  if (!configuredKey) {
    return NextResponse.json({ error: "Trace ingestion is not configured." }, { status: 503 });
  }
  const suppliedKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!suppliedKey || suppliedKey !== configuredKey) return unauthorized();

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body exceeds 1 MiB." }, { status: 413 });
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body exceeds 1 MiB." }, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = batchSchema.safeParse(Array.isArray(payload) ? payload : [payload]);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid trace payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const clickhouseUrl = process.env.CLICKHOUSE_URL;
  if (!clickhouseUrl) {
    return NextResponse.json(
      { error: "Trace storage is not configured. Set CLICKHOUSE_URL." },
      { status: 503 },
    );
  }

  const database = process.env.CLICKHOUSE_DATABASE ?? "agentlens";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(database)) {
    return NextResponse.json(
      { error: "CLICKHOUSE_DATABASE must be a valid ClickHouse database identifier." },
      { status: 503 },
    );
  }
  const rows = parsed.data.flatMap((trace) =>
    trace.spans.map((span) => ({
      trace_id: trace.traceId,
      project_id: trace.projectId,
      agent_name: trace.agentName,
      session_id: trace.sessionId ?? "",
      user_id: trace.userId ?? "",
      span_id: span.id,
      parent_span_id: span.parentId ?? "",
      span_name: span.name,
      span_kind: span.kind,
      status: span.status,
      started_at: new Date(span.startedAt).toISOString().replace("T", " ").replace("Z", ""),
      ended_at: new Date(span.endedAt ?? span.startedAt).toISOString().replace("T", " ").replace("Z", ""),
      model: span.model ?? "",
      tool_name: span.toolName ?? "",
      prompt_tokens: span.promptTokens ?? 0,
      completion_tokens: span.completionTokens ?? 0,
      cost_usd: span.costUsd ?? 0,
      input_json: JSON.stringify(span.input ?? null),
      output_json: JSON.stringify(span.output ?? null),
      error_message: span.error ?? "",
    })),
  );

  let endpoint: URL;
  try {
    endpoint = new URL(clickhouseUrl);
  } catch {
    return NextResponse.json({ error: "CLICKHOUSE_URL must be a valid URL." }, { status: 503 });
  }
  endpoint.searchParams.set("query", `INSERT INTO ${database}.trace_spans FORMAT JSONEachRow`);
  const credentials = `${process.env.CLICKHOUSE_USER ?? "default"}:${process.env.CLICKHOUSE_PASSWORD ?? ""}`;
  const auth = Buffer.from(credentials).toString("base64");

  let storageResponse: Response;
  try {
    storageResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-ndjson",
      },
      body: rows.map((row) => JSON.stringify(row)).join("\n"),
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
  } catch (error) {
    console.error("ClickHouse trace write failed", error);
    return NextResponse.json({ error: "Trace storage is unavailable." }, { status: 502 });
  }

  if (!storageResponse.ok) {
    console.error("ClickHouse rejected trace write", storageResponse.status);
    return NextResponse.json({ error: "Trace storage rejected the write." }, { status: 502 });
  }

  return NextResponse.json({ accepted: rows.length, traces: parsed.data.length }, { status: 202 });
}
