import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, Download, Bot, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";
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
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={spec.data}>
          <defs>
            <linearGradient id="aiArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
          <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
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
      <ResponsiveContainer width="100%" height={Math.max(240, spec.data.length * 32)}>
        <BarChart layout="vertical" data={spec.data} margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          {spec.keys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={spec.colors?.[i] ?? color} radius={[0, 4, 4, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={spec.data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
        <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [messages.length, loading]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // auto-grow the textarea up to a cap
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const hasMessages = messages.length > 0 || loading;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3 md:px-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">AI Query Assistant</h1>
            <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
              Demo data · May 2026
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask LRMIS indicators in plain language — get an answer, a chart, and the raw data.
          </p>
        </div>
        {hasMessages && (
          <button
            onClick={() => setMessages([])}
            className="hidden shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary md:block"
          >
            New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full max-w-4xl flex-col px-4 md:px-8">
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center gap-8 py-10 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-soft text-teal">
                  <Bot className="h-7 w-7" />
                </div>
                <p className="mt-4 text-base font-medium text-foreground">
                  What do you want to know about LRMIS data?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask about referral trends, facility compliance, or medicine availability.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3">
                {SUGGESTED.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => send(s.query)}
                    disabled={loading}
                    className="group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md disabled:opacity-50"
                  >
                    <div>
                      <Sparkles className="mb-2 h-4 w-4 text-teal" />
                      <div className="text-sm font-semibold text-foreground">{s.label}</div>
                      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {s.query}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-teal opacity-0 transition group-hover:opacity-100">
                      Ask this <ArrowRight className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-6">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-sm text-navy-foreground shadow-sm">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start gap-3">
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal text-[10px] font-bold text-teal-foreground">
                      AI
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border-l-[3px] border-teal bg-white p-4 shadow-sm">
                      <div className="max-w-[65ch] space-y-2 text-sm leading-relaxed text-foreground">
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
                ),
              )}

              {loading && (
                <div className="flex justify-start gap-3">
                  <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal text-[10px] font-bold text-teal-foreground">
                    AI
                  </div>
                  <div className="rounded-2xl rounded-tl-md border-l-[3px] border-teal bg-white p-4 shadow-sm">
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
                    <div className="mt-3 h-32 w-72 animate-pulse rounded-lg bg-secondary" />
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-background/80 px-4 py-4 backdrop-blur md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-teal/50"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about facilities, referrals, stockouts..."
            rows={1}
            disabled={loading}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 shrink-0 gap-1.5 bg-navy text-navy-foreground hover:bg-navy/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-4xl text-center text-[11px] text-muted-foreground">
          Press Enter to send, Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}
