import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeDollarSign, Receipt, Sparkles, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { MonthlyArea } from "@/components/charts/MonthlyArea";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { useStats } from "@/hooks/useStats";
import { useExpenses } from "@/hooks/useExpenses";
import { useBudgetProgress } from "@/hooks/useBudgets";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { fmtDate, fmtMoney } from "@/lib/format";

export default function DashboardPage() {
  const stats = useStats();
  const recent = useExpenses({ limit: 6 });
  const progress = useBudgetProgress();
  const subs = useSubscriptions();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total spent"
          value={fmtMoney(stats.data?.total_spent)}
          icon={<Wallet className="h-4 w-4" />}
          accent="primary"
          loading={stats.isPending}
        />
        <StatCard
          label="Income / refunds"
          value={fmtMoney(stats.data?.total_income)}
          icon={<ArrowUpRight className="h-4 w-4" />}
          accent="success"
          loading={stats.isPending}
        />
        <StatCard
          label="Net balance"
          value={fmtMoney(stats.data?.balance)}
          icon={<BadgeDollarSign className="h-4 w-4" />}
          accent={(stats.data?.balance ?? 0) >= 0 ? "accent" : "destructive"}
          loading={stats.isPending}
        />
        <StatCard
          label="Transactions"
          value={stats.data ? String(stats.data.expense_count) : "—"}
          icon={<Receipt className="h-4 w-4" />}
          accent="muted"
          loading={stats.isPending}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Monthly trend</CardTitle>
              <p className="text-xs text-muted-foreground">Spending across the months you've recorded.</p>
            </div>
          </CardHeader>
          <CardContent>
            <MonthlyArea data={stats.data?.by_month || {}} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <p className="text-xs text-muted-foreground">Where every dollar lands.</p>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={stats.data?.by_category || {}} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <p className="text-xs text-muted-foreground">Latest 6 transactions.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/expenses">View all →</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-3 pt-0">
            <ExpenseTable
              data={recent.data?.items}
              loading={recent.isPending}
              compact
              emptyAction={
                <Button asChild variant="gradient">
                  <Link to="/receipts">Upload your first receipt</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This month's budgets</CardTitle>
            <p className="text-xs text-muted-foreground">Live progress vs. category limits.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress.isPending && <div className="skeleton h-24 w-full rounded-md" />}
            {progress.data && progress.data.length === 0 && (
              <EmptyState
                title="No budgets yet"
                description="Pick a category and an amount to start tracking."
                action={
                  <Button asChild variant="gradient">
                    <Link to="/budgets">Add a budget</Link>
                  </Button>
                }
              />
            )}
            {progress.data?.slice(0, 4).map((p) => (
              <div key={p.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{p.category}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {fmtMoney(p.spent, p.currency)} / {fmtMoney(p.monthly_limit, p.currency)}
                  </span>
                </div>
                <Progress value={Math.min(100, p.percent)} />
                {p.over_budget && (
                  <p className="text-xs text-destructive">
                    Over by {fmtMoney(p.spent - p.monthly_limit, p.currency)}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Detected subscriptions</CardTitle>
            <p className="text-xs text-muted-foreground">
              Recurring charges found in your history.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/subscriptions">All →</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {subs.isPending && <div className="skeleton h-16 w-full rounded-md" />}
          {subs.data && subs.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing detected yet — add a few months of expenses and we'll surface patterns here.
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {subs.data?.slice(0, 6).map((s) => (
              <div
                key={`${s.merchant}-${s.amount}`}
                className="flex items-center justify-between rounded-lg border bg-card/40 p-3"
              >
                <div>
                  <div className="text-sm font-medium">{s.merchant}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.cadence_days}-day cadence · next ~ {fmtDate(s.next_expected)}
                  </div>
                </div>
                <div className="font-semibold tabular-nums">
                  {fmtMoney(s.amount, s.currency)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-card/30">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">Ask the AI advisor</div>
              <div className="text-xs text-muted-foreground">
                Personalized advice grounded in your spending and live ticker data.
              </div>
            </div>
          </div>
          <Button asChild variant="gradient">
            <Link to="/advisor">Open advisor</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
