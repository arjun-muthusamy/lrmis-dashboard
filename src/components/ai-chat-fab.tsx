import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bot, ChevronDown, ExternalLink, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { askAI } from "@/lib/ai-chat.functions";

type ChatMessage = { role: "user" | "assistant"; content: string };

const PAGE_TITLES: Record<string, string> = {
  "/overview": "Overview & Rankings",
  "/facility-hr": "Facility & Infrastructure",
  "/hr": "Human Resources",
  "/drugs-referrals": "Drugs, Consumables & Equipment",
  "/referrals": "Referrals",
  "/outcomes": "Outcome Indicators",
  "/obs-hdu": "Obs HDU",
  "/app-utility": "App Utility",
  "/reports": "Reports",
  "/admin": "Admin",
  "/settings": "Branding Settings",
  "/ai-assistant": "AI Query Assistant",
};

const PAGE_PROMPTS: Record<string, string[]> = {
  "/overview": [
    "What needs attention across the current snapshot?",
    "Show me the biggest district-level gaps",
  ],
  "/facility-hr": [
    "Which facilities have infrastructure gaps?",
    "Where are staffing signals most concerning?",
  ],
  "/hr": ["Summarise the most important HR gaps", "Which districts need staffing follow-up?"],
  "/drugs-referrals": [
    "Which medicines have the most stockout reports?",
    "Where do stockouts overlap with referrals?",
  ],
  "/referrals": [
    "Which districts have the highest referral pressure?",
    "Show the referral trend over time",
  ],
  "/outcomes": ["What outcome indicators need attention?", "Compare outcome signals by district"],
  "/obs-hdu": ["Which Obs HDU signals are most urgent?", "Summarise HDU capacity gaps"],
  "/app-utility": ["What is the current data coverage?", "Which app signals should I review?"],
  "/reports": ["Help me find a useful report view", "Summarise the latest operational signals"],
};

function titleFor(pathname: string) {
  if (pathname.startsWith("/district/")) {
    const district = decodeURIComponent(pathname.split("/district/")[1]?.split("/")[0] ?? "");
    return district ? `${district} District` : "District Detail";
  }
  const match = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "Dashboard";
}

function promptsFor(pathname: string, title: string) {
  return (
    PAGE_PROMPTS[Object.keys(PAGE_PROMPTS).find((path) => pathname.startsWith(path)) ?? ""] ?? [
      `What should I know about ${title.toLowerCase()}?`,
      "Show me the most important signals here",
    ]
  );
}

function messageText(content: string) {
  return content
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      part.startsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
}

function compactResponse(content: string) {
  return content.replace(/```json\s*[\s\S]*?```/g, "").trim();
}

export function AIChatFab({ pathname }: { pathname: string }) {
  const ask = useServerFn(askAI);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const title = useMemo(() => titleFor(pathname), [pathname]);
  const prompts = useMemo(() => promptsFor(pathname, title), [pathname, title]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (value: string) => {
    const content = value.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const contextualMessages = next.map((message, index) =>
        index === next.length - 1 && message.role === "user"
          ? {
              ...message,
              content: `[Current page: ${title}; route: ${pathname}]\n${message.content}`,
            }
          : message,
      );
      const result = await ask({ data: { messages: contextualMessages } });
      setMessages([...next, { role: "assistant", content: compactResponse(result.content) }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "I could not complete that request. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-label="LRMIS AI chat"
          className="pointer-events-auto flex h-[min(600px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-navy/15 bg-background shadow-[0_18px_55px_rgba(15,45,86,0.2)] animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <header className="flex items-center justify-between border-b border-border bg-navy px-4 py-3 text-navy-foreground">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal text-teal-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">LRMIS assistant</p>
                <p className="truncate text-[11px] text-navy-foreground/65">Viewing · {title}</p>
              </div>
            </div>
            <button
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-surface/70 px-3.5 py-4">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col justify-center">
                <div className="mb-5 text-center">
                  <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-teal-soft text-teal">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Ask about this page</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    I can inspect LRMIS indicators and explain operational signals.
                  </p>
                </div>
                <div className="space-y-2">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="group flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs text-foreground transition hover:border-teal/50 hover:bg-teal-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                    >
                      <span>{prompt}</span>
                      <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-teal opacity-0 transition group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={message.role === "user" ? "flex justify-end" : "flex gap-2"}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-teal text-[9px] font-bold text-teal-foreground">
                        AI
                      </div>
                    )}
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[84%] rounded-2xl rounded-br-md bg-navy px-3 py-2 text-xs leading-relaxed text-navy-foreground"
                          : "max-w-[88%] rounded-2xl rounded-tl-md border border-border bg-card px-3 py-2.5 text-xs leading-relaxed text-foreground"
                      }
                    >
                      {message.role === "assistant"
                        ? messageText(message.content)
                        : message.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="mt-1 grid h-6 w-6 place-items-center rounded-md bg-teal text-[9px] font-bold text-teal-foreground">
                      AI
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
                      <span className="inline-flex gap-1">
                        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal [animation-delay:150ms]" />
                        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card p-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2 rounded-xl border border-input bg-background px-2.5 py-1.5 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/15"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                aria-label="Ask LRMIS assistant"
                placeholder="Ask about LRMIS data..."
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent px-1 text-xs outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label="Send question"
                disabled={loading || !input.trim()}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-teal text-teal-foreground transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span>Context follows your current page</span>
              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-1 font-medium text-teal hover:underline"
              >
                Full assistant <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      )}
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close LRMIS assistant" : "Open LRMIS assistant"}
        aria-expanded={open}
        className="pointer-events-auto group flex items-center gap-2 rounded-full border border-teal/20 bg-navy px-3.5 py-2.5 text-xs font-semibold text-navy-foreground shadow-[0_8px_25px_rgba(15,45,86,0.2)] transition hover:-translate-y-0.5 hover:bg-navy/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        {open ? (
          <X className="h-4 w-4" />
        ) : (
          <MessageSquare className="h-4 w-4 text-teal-foreground" />
        )}
        <span className="hidden sm:inline">{open ? "Close" : "Ask"}</span>
      </button>
    </div>
  );
}
