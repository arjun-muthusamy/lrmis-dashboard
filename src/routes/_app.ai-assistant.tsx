import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, Download, Bot } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAI } from "@/lib/ai-chat.functions";
import { downloadCSV } from "@/lib/csv";

export const Route = createFileRoute("/_app/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Query Assistant — LRMIS" }] }),
  component: AIAssistantPage,
});

interface ChartSpec {
  chartType: "bar" | "horizontalBar" | "line";
  title: string;
  data: Array<Record<string, string | number>>;
  keys: string[];
  colors?: string[];
}

interface ParsedMessage {
  role: "user" | "assistant";
  content: string;
  text?: string;
  chart?: ChartSpec;
}

const SUGGESTED = [
  {
    label: "SUMAN vs Infrastructure Gap",
    query:
      "Show facilities where SUMAN branding is complete but infrastructure compliance score is below 60%",
  },
  {
    label: "Referral Load + Drug Stockouts",
    query:
      "Which districts have the highest referral-in load at their District Hospital but are also reporting drug stockouts?",
  },
  {
    label: "Top Stockout Drugs This Quarter",
    query:
      "Show the top 10 drugs with highest stockout frequency across all facilities this quarter",
  },
];

function parseResponse(content: string): { text: string; chart?: ChartSpec } {
  const m = content.match(/```json\s*([\s\S]*?)```/);
  if (!m) return { text: content };
  const text = content.replace(m[0], "").trim();
  try {
    const chart = JSON.parse(m[1]) as ChartSpec;
    return { text, chart };
  } catch {
    return { text: content };
  }
}

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-teal">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function ChartRenderer({ spec }: { spec: ChartSpec }) {
  const color = spec.colors?.[0] ?? "#0B7B8A";
  if (spec.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={spec.data}>
          <defs>
            <linearGradient id="aiArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
          <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {spec.keys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={spec.colors?.[i] ?? color}
              strokeWidth={2.5}
              fill="url(#aiArea)"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  if (spec.chartType === "horizontalBar") {
    return (
      <ResponsiveContainer width="100%" height={Math.max(220, spec.data.length * 28)}>
        <BarChart layout="vertical" data={spec.data} margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          {spec.keys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={spec.colors?.[i] ?? color} radius={[0, 4, 4, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={spec.data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
        <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        {spec.keys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={spec.colors?.[i] ?? color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function AIAssistantPage() {
  const ask = useServerFn(askAI);
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages.length, loading]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (query: string) => {
    if (!query.trim() || loading) return;
    const newMsgs: ParsedMessage[] = [...messages, { role: "user", content: query }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const history = newMsgs.map((m) => ({ role: m.role, content: m.content }));
      const { content } = await ask({ data: { messages: history } });
      const parsed = parseResponse(content);
      setMessages([
        ...newMsgs,
        { role: "assistant", content, text: parsed.text, chart: parsed.chart },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setMessages([...newMsgs, { role: "assistant", content: msg, text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-foreground">AI Query Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Ask natural language questions about LRMIS data. Get text insights and auto-generated
          charts.
        </p>
      </div>

      {/* Suggested */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-teal" />
        <span className="text-xs font-medium text-muted-foreground">Suggested queries:</span>
        {SUGGESTED.map((s) => (
          <button
            key={s.label}
            onClick={() => send(s.query)}
            disabled={loading}
            className="rounded-full border border-navy/20 bg-white px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-navy hover:text-navy-foreground disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-teal-soft text-teal">
              <Bot className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Ask anything about LRMIS data
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try one of the suggested queries above.
            </p>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl bg-navy px-4 py-2.5 text-sm text-navy-foreground shadow-sm">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="flex max-w-[90%] gap-3">
                <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal text-[10px] font-bold text-teal-foreground">
                  AI
                </div>
                <div className="rounded-2xl border-l-[3px] border-teal bg-white p-4 shadow-sm">
                  <div className="space-y-2 text-sm leading-relaxed text-foreground">
                    {(m.text ?? m.content)
                      .split("\n")
                      .map((p, j) => (p.trim() ? <p key={j}>{renderMarkdown(p)}</p> : null))}
                  </div>
                  {m.chart && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {m.chart.title}
                      </div>
                      <ChartRenderer spec={m.chart} />
                      <button
                        onClick={() =>
                          downloadCSV(
                            m.chart!.data as Record<string, unknown>[],
                            m.chart!.title.replace(/\s+/g, "_").toLowerCase(),
                          )
                        }
                        className="mt-2 inline-flex items-center gap-1 text-xs text-teal hover:underline"
                      >
                        <Download className="h-3 w-3" /> Download data as CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] gap-3">
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal text-[10px] font-bold text-teal-foreground">
                AI
              </div>
              <div className="rounded-2xl border-l-[3px] border-teal bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Analysing LRMIS data</span>
                  <span className="flex gap-1">
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                </div>
                <div className="mt-3 h-32 animate-pulse rounded-lg bg-secondary" />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          className="h-11 flex-1"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 gap-1.5 bg-navy text-navy-foreground hover:bg-navy/90"
        >
          Ask <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
