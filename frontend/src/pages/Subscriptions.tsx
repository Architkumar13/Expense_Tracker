import { Repeat, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { fmtDate, fmtMoney, fmtRelative } from "@/lib/format";

export default function SubscriptionsPage() {
  const subs = useSubscriptions();

  const total = (subs.data || []).reduce(
    (sum, s) => sum + (s.amount * 30) / Math.max(1, s.cadence_days),
    0,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Detected subscriptions</CardTitle>
            <p className="text-xs text-muted-foreground">
              Found by clustering same-merchant, same-amount charges over time.
            </p>
          </div>
          <Badge variant="accent">~ {fmtMoney(total)} / month</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {subs.isPending && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          {subs.data && subs.data.length === 0 && (
            <EmptyState
              icon={<Repeat className="h-5 w-5" />}
              title="No subscriptions detected yet"
              description="We need at least three charges from the same merchant at a regular cadence."
            />
          )}
          {subs.data?.map((s) => (
            <div
              key={`${s.merchant}-${s.amount}`}
              className="flex flex-col gap-2 rounded-xl border bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Repeat className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{s.merchant}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {s.category} · {s.count} charges seen
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-right text-xs sm:flex sm:items-center sm:gap-6">
                <div>
                  <div className="text-muted-foreground">Each</div>
                  <div className="text-sm font-semibold tabular-nums">
                    {fmtMoney(s.amount, s.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cadence</div>
                  <div className="text-sm font-medium">{s.cadence_days}d</div>
                </div>
                <div>
                  <div className="flex items-center justify-end gap-1 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> Next
                  </div>
                  <div className="text-sm font-medium">
                    {s.next_expected ? fmtDate(s.next_expected) : "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Last seen {fmtRelative(s.last_seen)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
