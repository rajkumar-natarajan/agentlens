"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Clock3,
  Code2,
  Command,
  Copy,
  Database,
  Download,
  Ellipsis,
  ExternalLink,
  FileCode2,
  Filter,
  Fingerprint,
  FlaskConical,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  MessageSquareText,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Timer,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

type Run = {
  id: string;
  agent: string;
  actor: string;
  status: "Success" | "Failed" | "Evaluating";
  duration: number;
  cost: number;
  model: string;
  time: string;
  input: string;
  output: string;
  promptTokens: number;
  completionTokens: number;
  score: number;
  spans: { name: string; kind: string; duration: number; status: "ok" | "error"; detail: string }[];
};

const runs: Run[] = [
  {
    id: "tr_8f2a9b7c1d",
    agent: "support-copilot",
    actor: "sarah.chen@acme.io",
    status: "Success",
    duration: 1_284,
    cost: 0.0248,
    model: "claude-3.5-sonnet",
    time: "12:42:18.402",
    input: "I was charged twice for my subscription this month. Can you check my account?",
    output: "I found a duplicate charge of $29.00 on March 14. I've initiated a refund — it should appear in 3–5 business days.",
    promptTokens: 1842,
    completionTokens: 328,
    score: 0.96,
    spans: [
      { name: "support-copilot", kind: "Agent", duration: 1284, status: "ok", detail: "Root orchestration · 2 child spans" },
      { name: "classify_intent", kind: "LLM", duration: 362, status: "ok", detail: "claude-3.5-sonnet · 1,842 tokens" },
      { name: "lookup_billing_history", kind: "Tool", duration: 684, status: "ok", detail: "GET /billing/history · 200 OK" },
      { name: "generate_response", kind: "LLM", duration: 238, status: "ok", detail: "claude-3.5-sonnet · 328 tokens" },
    ],
  },
  {
    id: "tr_3c1d5e9a2b",
    agent: "research-assistant",
    actor: "marcus.j@acme.io",
    status: "Success",
    duration: 8_432,
    cost: 0.1824,
    model: "gpt-4o",
    time: "12:41:52.118",
    input: "Summarize the latest research on retrieval-augmented generation for our team.",
    output: "Here are the key developments in RAG this quarter, with sources and a comparison of the leading approaches…",
    promptTokens: 6482,
    completionTokens: 1850,
    score: 0.92,
    spans: [
      { name: "research-assistant", kind: "Agent", duration: 8432, status: "ok", detail: "Root orchestration · 3 child spans" },
      { name: "search_web", kind: "Tool", duration: 2184, status: "ok", detail: "12 results returned" },
      { name: "retrieve_papers", kind: "Tool", duration: 3412, status: "ok", detail: "Vector search · 8 documents" },
      { name: "synthesize_summary", kind: "LLM", duration: 2836, status: "ok", detail: "gpt-4o · 8,332 tokens" },
    ],
  },
  {
    id: "tr_7b4e2f8c6a",
    agent: "data-analyst",
    actor: "priya.k@acme.io",
    status: "Failed",
    duration: 2_106,
    cost: 0.0082,
    model: "gpt-4o-mini",
    time: "12:40:36.771",
    input: "Show me monthly revenue by region for Q1 and compare against last year.",
    output: "Query execution failed. The `region` column does not exist in the selected view.",
    promptTokens: 1254,
    completionTokens: 86,
    score: 0.24,
    spans: [
      { name: "data-analyst", kind: "Agent", duration: 2106, status: "error", detail: "Root orchestration · 2 child spans" },
      { name: "generate_sql", kind: "LLM", duration: 742, status: "ok", detail: "gpt-4o-mini · 1,340 tokens" },
      { name: "execute_query", kind: "Tool", duration: 1364, status: "error", detail: "Unknown column: region" },
    ],
  },
  {
    id: "tr_2d9a6f3e1c",
    agent: "support-copilot",
    actor: "james.w@acme.io",
    status: "Success",
    duration: 946,
    cost: 0.0196,
    model: "claude-3.5-sonnet",
    time: "12:39:08.295",
    input: "How do I reset the two-factor authentication on my account?",
    output: "To reset 2FA, open Settings → Security and choose “Reset authenticator.” I can also start that process for you.",
    promptTokens: 1578,
    completionTokens: 256,
    score: 0.98,
    spans: [
      { name: "support-copilot", kind: "Agent", duration: 946, status: "ok", detail: "Root orchestration · 1 child span" },
      { name: "answer_from_knowledge", kind: "LLM", duration: 946, status: "ok", detail: "claude-3.5-sonnet · 1,834 tokens" },
    ],
  },
  {
    id: "tr_a91c0b4d7e",
    agent: "code-reviewer",
    actor: "elena.r@acme.io",
    status: "Evaluating",
    duration: 4_218,
    cost: 0.0642,
    model: "claude-3.5-sonnet",
    time: "12:37:44.043",
    input: "Review the authentication middleware changes in PR #284.",
    output: "I found two potential issues: missing token expiry validation and an unhandled refresh failure path…",
    promptTokens: 3821,
    completionTokens: 1084,
    score: 0,
    spans: [
      { name: "code-reviewer", kind: "Agent", duration: 4218, status: "ok", detail: "Root orchestration · 3 child spans" },
      { name: "fetch_pull_request", kind: "Tool", duration: 582, status: "ok", detail: "GitHub API · 200 OK" },
      { name: "review_diff", kind: "LLM", duration: 2984, status: "ok", detail: "claude-3.5-sonnet · 4,905 tokens" },
      { name: "post_review", kind: "Tool", duration: 652, status: "ok", detail: "GitHub API · pending approval" },
    ],
  },
  {
    id: "tr_4e6f1a3c8b",
    agent: "research-assistant",
    actor: "david.l@acme.io",
    status: "Success",
    duration: 6_102,
    cost: 0.1246,
    model: "gpt-4o",
    time: "12:36:19.562",
    input: "Compare the privacy policies of the top three competitors.",
    output: "I compared the latest privacy policies for Acme competitors. The main differences are in data retention and training opt-outs…",
    promptTokens: 5120,
    completionTokens: 1426,
    score: 0.88,
    spans: [
      { name: "research-assistant", kind: "Agent", duration: 6102, status: "ok", detail: "Root orchestration · 2 child spans" },
      { name: "search_web", kind: "Tool", duration: 1848, status: "ok", detail: "9 results returned" },
      { name: "compare_policies", kind: "LLM", duration: 4254, status: "ok", detail: "gpt-4o · 6,546 tokens" },
    ],
  },
  {
    id: "tr_0d8c4b2f5e",
    agent: "support-copilot",
    actor: "amy.t@acme.io",
    status: "Success",
    duration: 1_102,
    cost: 0.0214,
    model: "claude-3.5-sonnet",
    time: "12:35:47.086",
    input: "My order #A-4921 hasn't arrived yet. Can you help?",
    output: "Your order is in transit and expected to arrive by Thursday, March 20. Here's your tracking link…",
    promptTokens: 1630,
    completionTokens: 294,
    score: 0.95,
    spans: [
      { name: "support-copilot", kind: "Agent", duration: 1102, status: "ok", detail: "Root orchestration · 2 child spans" },
      { name: "lookup_order", kind: "Tool", duration: 416, status: "ok", detail: "Orders API · 200 OK" },
      { name: "generate_response", kind: "LLM", duration: 686, status: "ok", detail: "claude-3.5-sonnet · 1,924 tokens" },
    ],
  },
  {
    id: "tr_b63e1c9a4d",
    agent: "data-analyst",
    actor: "tom.n@acme.io",
    status: "Failed",
    duration: 3_764,
    cost: 0.0128,
    model: "gpt-4o-mini",
    time: "12:34:28.801",
    input: "What were our five highest-growth product categories last quarter?",
    output: "The query timed out while scanning the product events table.",
    promptTokens: 2086,
    completionTokens: 148,
    score: 0.31,
    spans: [
      { name: "data-analyst", kind: "Agent", duration: 3764, status: "error", detail: "Root orchestration · 2 child spans" },
      { name: "generate_sql", kind: "LLM", duration: 862, status: "ok", detail: "gpt-4o-mini · 2,234 tokens" },
      { name: "execute_query", kind: "Tool", duration: 2902, status: "error", detail: "Query timed out after 3s" },
    ],
  },
];

const navGroups: { label: string; links: { name: string; icon: LucideIcon; count?: string; badge?: string }[] }[] = [
  {
    label: "OBSERVE",
    links: [
      { name: "Overview", icon: BarChart3 },
      { name: "Traces", icon: Activity, count: "12.8k" },
      { name: "Agents", icon: Bot, count: "8" },
      { name: "Sessions", icon: Layers3 },
    ],
  },
  {
    label: "IMPROVE",
    links: [
      { name: "Evaluations", icon: FlaskConical, badge: "4" },
      { name: "Datasets", icon: Database },
      { name: "Prompts", icon: FileCode2 },
    ],
  },
  {
    label: "GOVERN",
    links: [
      { name: "Guardrails", icon: ShieldCheck },
      { name: "Audit log", icon: Fingerprint },
    ],
  },
];

function StatusBadge({ status }: { status: Run["status"] }) {
  const statusClass = status === "Success" ? "success" : status === "Failed" ? "failed" : "pending";
  return (
    <span className={`status-badge ${statusClass}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

function formatDuration(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

function Sparkline({ variant = 0 }: { variant?: number }) {
  const paths = [
    "M1 20 L10 17 L19 19 L28 12 L37 14 L46 8 L55 11 L64 6 L73 9 L82 4 L91 7 L100 2",
    "M1 15 L10 16 L19 12 L28 17 L37 14 L46 18 L55 9 L64 12 L73 8 L82 10 L91 4 L100 6",
    "M1 8 L10 12 L19 9 L28 13 L37 10 L46 15 L55 11 L64 16 L73 12 L82 17 L91 11 L100 14",
    "M1 18 L10 14 L19 17 L28 10 L37 13 L46 7 L55 9 L64 5 L73 8 L82 4 L91 6 L100 2",
  ];
  return (
    <svg className="sparkline" viewBox="0 0 101 24" aria-hidden="true">
      <path d={paths[variant]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Drawer({ run, onClose }: { run: Run; onClose: () => void }) {
  const [tab, setTab] = useState("Timeline");
  return (
    <>
      <button className="drawer-scrim" aria-label="Close trace details" onClick={onClose} />
      <aside className="trace-drawer">
        <div className="drawer-head">
          <div>
            <div className="eyebrow drawer-kicker">TRACE DETAIL <span className="live-indicator" /></div>
            <h2>{run.agent}</h2>
            <span className="mono trace-id">{run.id}</span>
          </div>
          <div className="drawer-actions">
            <button className="icon-button" aria-label="Copy trace ID"><Copy size={15} /></button>
            <button className="icon-button" aria-label="Close details" onClick={onClose}><X size={17} /></button>
          </div>
        </div>
        <div className="drawer-meta">
          <StatusBadge status={run.status} />
          <span><Clock3 size={13} /> {formatDuration(run.duration)}</span>
          <span><Zap size={13} /> ${run.cost.toFixed(4)}</span>
        </div>
        <div className="drawer-tabs">
          {["Timeline", "Input / output", "Evaluations"].map((item) => (
            <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
        {tab === "Timeline" ? (
          <div className="timeline-content">
            <div className="timeline-heading"><span>SPAN TREE</span><span>DURATION</span></div>
            {run.spans.map((span, index) => (
              <div className="span-row" key={`${span.name}-${index}`}>
                <div className="span-name">
                  <span className={`span-icon ${span.kind.toLowerCase()}`}>{span.kind === "LLM" ? <Sparkles size={12} /> : span.kind === "Tool" ? <TerminalSquare size={12} /> : <Bot size={12} />}</span>
                  <div><strong>{span.name}</strong><small>{span.detail}</small></div>
                </div>
                <div className="span-duration">
                  <span>{formatDuration(span.duration)}</span>
                  <div className="span-bar"><i style={{ width: `${Math.max(11, span.duration / run.duration * 100)}%` }} className={span.status === "error" ? "error-bar" : ""} /></div>
                </div>
              </div>
            ))}
            <div className="span-inspector">
              <div className="inspector-title"><div><span className="span-icon llm"><Sparkles size={12} /></span><strong>generate_response</strong></div><MoreHorizontal size={16} /></div>
              <div className="inspector-sub">LLM GENERATION <span>·</span> 238 ms <span>·</span> claude-3.5-sonnet</div>
              <div className="payload-block">
                <div className="payload-label">INPUT <button><Copy size={11} /> Copy</button></div>
                <p className="payload-code">{"[{ role: \"user\", content: \"I was charged twice for my subscription...\" }]"}</p>
              </div>
              <div className="payload-block">
                <div className="payload-label">OUTPUT <button><Copy size={11} /> Copy</button></div>
                <p className="payload-code">{"{ role: \"assistant\", content: \"I found a duplicate charge of $29.00...\" }"}</p>
              </div>
              <div className="token-row"><span>Prompt <b>1,842</b></span><span>Completion <b>328</b></span><span>Cost <b>$0.0248</b></span></div>
            </div>
          </div>
        ) : tab === "Input / output" ? (
          <div className="io-content">
            <div className="payload-block"><div className="payload-label">USER INPUT <button><Copy size={11} /> Copy</button></div><p className="payload-code">{run.input}</p></div>
            <div className="payload-block"><div className="payload-label">AGENT OUTPUT <button><Copy size={11} /> Copy</button></div><p className="payload-code">{run.output}</p></div>
            <div className="io-meta"><span>Prompt tokens <b>{run.promptTokens.toLocaleString()}</b></span><span>Completion tokens <b>{run.completionTokens.toLocaleString()}</b></span><span>Model <b>{run.model}</b></span></div>
          </div>
        ) : (
          <div className="eval-content">
            <div className="eval-summary"><div className="score-ring">{run.score ? `${Math.round(run.score * 100)}` : "—"}<small>/100</small></div><div><strong>Overall quality</strong><small>{run.score ? "Auto-evaluated · 2 min ago" : "Evaluation in progress"}</small></div></div>
            {[["Answer relevance", run.score ? Math.min(99, Math.round(run.score * 100)) : 0], ["Groundedness", run.score ? 94 : 0], ["Tool accuracy", run.score ? 100 : 0]].map(([label, score]) => <div className="eval-meter" key={label}><span>{label}</span><b>{score ? `${score}%` : "Pending"}</b><i><em style={{ width: `${score}%` }} /></i></div>)}
            <button className="outline-button annotation-button"><MessageSquareText size={14} /> Add human annotation</button>
          </div>
        )}
        <div className="drawer-footer"><button className="text-button"><MessageSquareText size={14} /> Add comment</button><button className="text-button"><ExternalLink size={14} /> Open session</button></div>
      </aside>
    </>
  );
}

export default function AgentLensApp() {
  const [activeNav, setActiveNav] = useState("Traces");
  const [query, setQuery] = useState("");
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [agentFilter, setAgentFilter] = useState("All agents");
  const [showFilters, setShowFilters] = useState(false);
  const [timeRange, setTimeRange] = useState("Last 24 hours");

  const filteredRuns = useMemo(
    () => runs.filter((run) => {
      const searchable = `${run.id} ${run.agent} ${run.actor} ${run.model} ${run.input}`.toLowerCase();
      return searchable.includes(query.toLowerCase()) &&
        (statusFilter === "All statuses" || run.status === statusFilter) &&
        (agentFilter === "All agents" || run.agent === agentFilter);
    }),
    [query, statusFilter, agentFilter],
  );

  const navigationClick = (name: string) => {
    setActiveNav(name);
    if (name !== "Traces") setQuery("");
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark"><span /><span /><span /><span /></div>
          <span className="brand-name">agent<span>lens</span></span>
          <button className="sidebar-collapse" aria-label="Collapse sidebar"><PanelLeftClose size={15} /></button>
        </div>
        <button className="workspace-switcher">
          <div className="workspace-avatar">A</div>
          <div className="workspace-copy"><strong>Acme, Inc.</strong><small>Production workspace</small></div>
          <ChevronsUpDown size={14} className="muted-icon" />
        </button>
        <div className="project-caption"><span>PROJECT</span><button><Plus size={13} /></button></div>
        <button className="project-switcher"><span className="project-dot" /><span>acme-production</span><ChevronDown size={13} /></button>
        <nav className="main-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.links.map(({ name, icon: Icon, count, badge }) => (
                <button className={`nav-item ${activeNav === name ? "active" : ""}`} onClick={() => navigationClick(name)} key={name}>
                  <Icon size={16} strokeWidth={1.8} /><span>{name}</span>
                  {count && <span className="nav-count">{count}</span>}
                  {badge && <span className="nav-badge">{badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="usage-card">
            <div className="usage-heading"><span>MONTHLY EVENTS</span><CircleHelp size={12} /></div>
            <div className="usage-number">2.4M <span>/ 5M</span></div>
            <div className="usage-track"><i /></div>
            <small>48% of your plan used</small>
          </div>
          <button className="nav-item"><Settings2 size={16} /><span>Settings</span></button>
          <button className="nav-item"><LifeBuoy size={16} /><span>Help & support</span><ArrowUpRight size={12} className="help-arrow" /></button>
          <div className="user-profile">
            <div className="user-avatar">RK</div><div className="user-details"><strong>Raj Kumar</strong><small>Admin</small></div><Ellipsis size={17} />
          </div>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>acme-production</span><ChevronRight size={13} /><strong>{activeNav}</strong></div>
          <div className="topbar-tools">
            <button className="command-search" onClick={() => document.getElementById("trace-search")?.focus()}><Search size={14} /><span>Search anything...</span><kbd><Command size={10} /> K</kbd></button>
            <button className="top-icon" aria-label="Notifications"><Bell size={16} /><i /></button>
            <button className="top-help"><CircleHelp size={15} /> <span>Docs</span></button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="heading-overline"><span className="live-indicator" /> LIVE DATA <span className="overline-divider">/</span> OBSERVABILITY</div><h1>{activeNav === "Traces" ? "Traces" : activeNav}</h1><p>Inspect, debug, and understand every agent run.</p></div>
            <div className="heading-actions"><button className="outline-button"><Download size={14} /> Export</button><button className="primary-button"><Plus size={15} /> New view</button></div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card"><div className="metric-top"><span>Total runs</span><Activity size={15} /></div><div className="metric-value">12,847 <span className="metric-change positive"><ArrowUpRight size={12} /> 12.8%</span></div><div className="metric-foot"><Sparkline variant={0} /><span>vs. previous period</span></div></div>
            <div className="metric-card"><div className="metric-top"><span>Error rate</span><AlertTriangle size={15} /></div><div className="metric-value">2.4% <span className="metric-change negative"><ArrowDownRight size={12} /> 0.8%</span></div><div className="metric-foot"><Sparkline variant={1} /><span>vs. previous period</span></div></div>
            <div className="metric-card"><div className="metric-top"><span>Median latency</span><Timer size={15} /></div><div className="metric-value">1.28s <span className="metric-change positive"><ArrowDownRight size={12} /> 8.2%</span></div><div className="metric-foot"><Sparkline variant={2} /><span>p95 <b>4.82s</b></span></div></div>
            <div className="metric-card"><div className="metric-top"><span>Total cost</span><Zap size={15} /></div><div className="metric-value">$284.62 <span className="metric-change neutral"><ArrowUpRight size={12} /> 4.1%</span></div><div className="metric-foot"><Sparkline variant={3} /><span>avg. <b>$0.022/run</b></span></div></div>
          </div>

          <div className="chart-card">
            <div className="chart-header"><div><h2>Run volume</h2><p>Agent executions over time</p></div><div className="chart-tools"><div className="chart-legend"><span><i className="legend-success" /> Successful</span><span><i className="legend-failed" /> Failed</span></div><button className="select-button" onClick={() => setTimeRange(timeRange === "Last 24 hours" ? "Last 7 days" : "Last 24 hours")}>{timeRange}<ChevronDown size={13} /></button><button className="chart-menu" aria-label="Chart options"><MoreHorizontal size={17} /></button></div></div>
            <div className="chart">
              <div className="chart-y-labels"><span>1.2k</span><span>900</span><span>600</span><span>300</span><span>0</span></div>
              <div className="chart-plot">
                <div className="gridlines"><i /><i /><i /><i /><i /></div>
                <svg className="chart-svg" viewBox="0 0 900 132" preserveAspectRatio="none" aria-label="Run volume chart">
                  <defs><linearGradient id="successFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#35d6a0" stopOpacity=".18" /><stop offset="100%" stopColor="#35d6a0" stopOpacity="0" /></linearGradient><linearGradient id="failedFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f27777" stopOpacity=".13" /><stop offset="100%" stopColor="#f27777" stopOpacity="0" /></linearGradient></defs>
                  <path d="M0 101 C22 94 28 68 56 75 S92 91 112 69 S149 82 168 59 S202 73 225 53 S260 63 280 43 S318 56 338 39 S372 45 394 27 S426 44 449 34 S482 52 505 39 S538 46 562 26 S596 38 617 20 S649 35 674 23 S707 38 730 18 S764 24 786 13 S823 31 844 18 S874 28 900 10 V132 H0 Z" fill="url(#successFill)" />
                  <path d="M0 101 C22 94 28 68 56 75 S92 91 112 69 S149 82 168 59 S202 73 225 53 S260 63 280 43 S318 56 338 39 S372 45 394 27 S426 44 449 34 S482 52 505 39 S538 46 562 26 S596 38 617 20 S649 35 674 23 S707 38 730 18 S764 24 786 13 S823 31 844 18 S874 28 900 10" fill="none" stroke="#35d6a0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <path d="M0 120 C24 117 32 108 56 112 S92 118 112 105 S149 114 168 103 S202 109 225 97 S260 106 280 94 S318 105 338 91 S372 100 394 87 S426 98 449 89 S482 102 505 91 S538 98 562 83 S596 96 617 80 S649 90 674 84 S707 97 730 79 S764 90 786 75 S823 90 844 78 S874 87 900 71 V132 H0 Z" fill="url(#failedFill)" />
                  <path d="M0 120 C24 117 32 108 56 112 S92 118 112 105 S149 114 168 103 S202 109 225 97 S260 106 280 94 S318 105 338 91 S372 100 394 87 S426 98 449 89 S482 102 505 91 S538 98 562 83 S596 96 617 80 S649 90 674 84 S707 97 730 79 S764 90 786 75 S823 90 844 78 S874 87 900 71" fill="none" stroke="#ef7777" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="chart-x-labels"><span>12:00 AM</span><span>3:00 AM</span><span>6:00 AM</span><span>9:00 AM</span><span>12:00 PM</span><span>3:00 PM</span><span>6:00 PM</span><span>9:00 PM</span></div>
              </div>
            </div>
          </div>

          <div className="table-heading"><div><h2>Recent runs</h2><span className="run-count">{filteredRuns.length} of 12,847</span></div><button className="table-options"><SlidersHorizontal size={14} /> Columns</button></div>
          <div className="filter-toolbar">
            <label className="table-search"><Search size={14} /><input id="trace-search" placeholder="Search by ID, agent, user, or input..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ F</kbd></label>
            <button className={`filter-button ${showFilters ? "filter-on" : ""}`} onClick={() => setShowFilters(!showFilters)}><Filter size={14} /> Filters {(statusFilter !== "All statuses" || agentFilter !== "All agents") && <span className="filter-count">1</span>}<ChevronDown size={12} /></button>
            <button className="select-button time-select" onClick={() => setTimeRange(timeRange === "Last 24 hours" ? "Last 7 days" : "Last 24 hours")}><Clock3 size={13} /> {timeRange}<ChevronDown size={12} /></button>
            <button className="refresh-button" title="Refresh"><Activity size={14} /></button>
          </div>
          {showFilters && <div className="filter-popover">
            <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Success</option><option>Failed</option><option>Evaluating</option></select></label>
            <label>Agent<select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}><option>All agents</option>{Array.from(new Set(runs.map((run) => run.agent))).map((agent) => <option key={agent}>{agent}</option>)}</select></label>
            <button onClick={() => { setStatusFilter("All statuses"); setAgentFilter("All agents"); }}>Clear all</button>
          </div>}
          <div className="runs-table-wrap">
            <table className="runs-table">
              <thead><tr><th className="checkbox-col"><input type="checkbox" aria-label="Select all traces" /></th><th>STATUS</th><th>AGENT / TRACE</th><th>USER</th><th>DURATION</th><th>COST</th><th>MODEL</th><th>STARTED AT</th><th></th></tr></thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run.id} onClick={() => setSelectedRun(run)}>
                    <td className="checkbox-col"><input type="checkbox" aria-label={`Select ${run.id}`} onClick={(event) => event.stopPropagation()} /></td>
                    <td><StatusBadge status={run.status} /></td>
                    <td><div className="agent-cell"><div className={`agent-glyph ${run.agent === "support-copilot" ? "cyan" : run.agent === "research-assistant" ? "violet" : run.agent === "data-analyst" ? "amber" : "green"}`}>{run.agent === "support-copilot" ? <Bot size={14} /> : run.agent === "research-assistant" ? <Search size={13} /> : run.agent === "data-analyst" ? <BarChart3 size={13} /> : <Code2 size={13} />}</div><div><strong>{run.agent}</strong><small className="mono">{run.id}</small></div></div></td>
                    <td><span className="user-cell">{run.actor}</span></td>
                    <td><span className={run.duration > 4000 ? "duration-slow" : "duration-cell"}>{formatDuration(run.duration)}</span></td>
                    <td className="cost-cell">${run.cost.toFixed(4)}</td>
                    <td><span className="model-pill">{run.model}</span></td>
                    <td><span className="time-cell">{run.time}</span></td>
                    <td><button className="row-menu" aria-label="Run actions" onClick={(event) => { event.stopPropagation(); setSelectedRun(run); }}><MoreHorizontal size={16} /></button></td>
                  </tr>
                ))}
                {filteredRuns.length === 0 && <tr><td className="empty-row" colSpan={9}><Search size={18} /><strong>No runs match these filters</strong><span>Try a different query or clear the active filters.</span><button onClick={() => { setQuery(""); setStatusFilter("All statuses"); setAgentFilter("All agents"); }}>Clear filters</button></td></tr>}
              </tbody>
            </table>
            <div className="table-pagination"><span>Showing <b>{filteredRuns.length ? "1–" + filteredRuns.length : "0"}</b> of <b>12,847</b> runs</span><div><button disabled><ChevronLeft size={14} /></button><button className="current-page">1</button><button>2</button><button>3</button><span>…</span><button>1285</button><button><ChevronRight size={14} /></button></div></div>
          </div>
          <div className="footer-caption"><span><LockKeyhole size={11} /> Data encrypted in transit and at rest</span><span>Updated just now <span className="live-indicator" /></span></div>
        </div>
      </section>
      {selectedRun && <Drawer run={selectedRun} onClose={() => setSelectedRun(null)} />}
    </main>
  );
}
