import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useContributeGoal, useCreateGoal, useDeleteGoal, useGoals } from "@/hooks/useGoals";
import { fmtDate, fmtMoney } from "@/lib/format";
import type { Goal } from "@/types/api";

function GoalCard({ goal, onContribute, onDelete }: { goal: Goal; onContribute: () => void; onDelete: () => void }) {
  const pct = goal.target_amount ? Math.min(100, (goal.saved_amount / goal.target_amount) * 100) : 0;
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{goal.name}</div>
              {goal.deadline && (
                <div className="text-xs text-muted-foreground">By {fmtDate(goal.deadline)}</div>
              )}
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
        <div className="text-sm">
          <span className="font-semibold tabular-nums">{fmtMoney(goal.saved_amount, goal.currency)}</span>
          <span className="text-muted-foreground"> / {fmtMoney(goal.target_amount, goal.currency)}</span>
        </div>
        <Progress value={pct} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{remaining > 0 ? `${fmtMoney(remaining, goal.currency)} to go` : "Goal achieved 🎉"}</span>
          <Button variant="outline" size="sm" onClick={onContribute}>
            <Plus className="h-3 w-3" /> Contribute
          </Button>
        </div>
        {goal.notes && <p className="text-xs text-muted-foreground">{goal.notes}</p>}
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const goals = useGoals();
  const create = useCreateGoal();
  const contribute = useContributeGoal();
  const del = useDeleteGoal();

  const [open, setOpen] = useState(false);
  const [contributeFor, setContributeFor] = useState<Goal | null>(null);
  const [contribAmt, setContribAmt] = useState("");

  // create form
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      name,
      target_amount: parseFloat(target),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      notes,
    });
    setOpen(false);
    setName("");
    setTarget("");
    setDeadline("");
    setNotes("");
  }

  function submitContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!contributeFor) return;
    const amt = parseFloat(contribAmt);
    if (!Number.isFinite(amt) || amt === 0) return;
    contribute.mutate({ id: contributeFor.id, amount: amt });
    setContributeFor(null);
    setContribAmt("");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Savings goals</CardTitle>
            <p className="text-xs text-muted-foreground">
              Track progress toward purchases, emergency funds and trips.
            </p>
          </div>
          <Button variant="gradient" size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.isPending &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          {goals.data && goals.data.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                icon={<Target className="h-5 w-5" />}
                title="No goals yet"
                description="Set a target amount and deadline. Contribute as you save."
                action={
                  <Button variant="gradient" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" /> Create your first goal
                  </Button>
                }
              />
            </div>
          )}
          {goals.data?.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onContribute={() => setContributeFor(g)}
              onDelete={() => del.mutate(g.id)}
            />
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
            <DialogDescription>Define what you're saving toward and when.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="target">Target ($)</Label>
                <Input
                  id="target"
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goalNotes">Notes</Label>
              <Textarea
                id="goalNotes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Create goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(contributeFor)} onOpenChange={(o) => !o && setContributeFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribute</DialogTitle>
            <DialogDescription>
              {contributeFor && `Add to "${contributeFor.name}". Enter a negative amount to undo.`}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitContribute}>
            <div className="space-y-1.5">
              <Label htmlFor="amt">Amount</Label>
              <Input
                id="amt"
                type="number"
                step="0.01"
                required
                value={contribAmt}
                onChange={(e) => setContribAmt(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setContributeFor(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={contribute.isPending}>
                {contribute.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
