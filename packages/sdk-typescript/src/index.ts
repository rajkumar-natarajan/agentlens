export type SpanKind = "llm" | "tool" | "chain" | "agent" | "retrieval";

export interface SpanInput {
  id: string;
  parentId?: string;
  name: string;
  kind: SpanKind;
  startedAt: string;
  endedAt?: string;
  status?: "ok" | "error";
  model?: string;
  input?: unknown;
  output?: unknown;
  toolName?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  error?: string;
}

export interface TraceInput {
  traceId: string;
  projectId: string;
  agentName: string;
  sessionId?: string;
  userId?: string;
  startedAt: string;
  spans: SpanInput[];
}

export interface AgentLensClientOptions {
  apiKey: string;
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
}

export class AgentLensClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: AgentLensClientOptions) {
    if (!options.apiKey) throw new Error("AgentLens apiKey is required.");
    this.apiKey = options.apiKey;
    this.endpoint = `${(options.endpoint ?? "http://localhost:3000").replace(/\/$/, "")}/api/v1/traces`;
    this.fetcher = options.fetch ?? globalThis.fetch;
  }

  async sendTrace(trace: TraceInput): Promise<void> {
    await this.sendBatch([trace]);
  }

  async sendBatch(traces: TraceInput[]): Promise<void> {
    if (traces.length === 0) throw new Error("At least one trace is required.");
    const response = await this.fetcher(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(traces),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`AgentLens ingestion failed (${response.status}): ${detail}`);
    }
  }
}
