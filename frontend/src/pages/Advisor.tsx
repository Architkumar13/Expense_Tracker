import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useChatHistory, useClearChat, useQuotes, useSendChat } from "@/hooks/useAdvisor";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Where am I overspending this month?",
  "Compare AAPL vs MSFT for a long-term hold",
  "Is VTSAX a reasonable core US fund?",
  "How should I prioritise my goals?",
];

export default function AdvisorPage() {
  const history = useChatHistory();
  const send = useSendChat();
  const clear = useClearChat();
  const [draft, setDraft] = useState("");
  const [watchInput, setWatchInput] = useState("AAPL,MSFT,VTI");
  const symbols = useMemo(
    () =>
      watchInput
        .split(/[,\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    [watchInput],
  );
  const quotes = useQuotes(symbols);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [history.data, send.isPending]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft("");
    await send.mutateAsync(trimmed);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="flex h-[640px] flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle>Financial advisor</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => clear.mutate()}>
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
            {history.isPending && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-2/3" />)}
            {history.data && history.data.length === 0 && (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="Ask anything about your money"
                description="Your spending summary and any tickers you mention are sent along as context."
              />
            )}
            {history.data?.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "gradient-bg text-white shadow-primary/30"
                      : "bg-secondary text-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {send.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="rounded-full border bg-background/50 px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask anything — I'll factor in your spending and any tickers you mention."
            />
            <Button type="submit" variant="gradient" disabled={send.isPending || !draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
          <p className="text-xs text-muted-foreground">Live quotes via yfinance.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={watchInput}
            onChange={(e) => setWatchInput(e.target.value)}
            placeholder="AAPL, MSFT, VTSAX"
          />
          {quotes.isPending && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          {quotes.data?.map((q) => {
            const up = (q.change_pct ?? 0) >= 0;
            return (
              <div
                key={q.symbol}
                className="flex items-center justify-between rounded-lg border bg-card/40 p-3"
              >
                <div>
                  <div className="font-semibold">{q.symbol}</div>
                  <div className="text-xs text-muted-foreground">{q.name || ""}</div>
                </div>
                <div className="text-right">
                  {q.error ? (
                    <div className="text-xs text-destructive">{q.error}</div>
                  ) : (
                    <>
                      <div className="font-semibold tabular-nums">
                        {fmtMoney(q.price, q.currency)}
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-end gap-1 text-xs",
                          up ? "text-success" : "text-destructive",
                        )}
                      >
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {q.change_pct.toFixed(2)}%
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground">
            Educational only — not licensed financial advice.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
