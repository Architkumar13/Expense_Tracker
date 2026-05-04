import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, type Expense, type ExpenseCreate } from "@/types/api";
import { useCreateExpense, useUpdateExpense } from "@/hooks/useExpenses";
import { useUIStore } from "@/store/ui";

interface Props {
  expense?: Expense | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FormValues {
  description: string;
  amount: number;
  currency: string;
  category: string;
  merchant: string;
  occurred_at: string;
  notes: string;
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  const off = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ExpenseFormDialog({ expense, open: controlledOpen, onOpenChange }: Props) {
  const storeOpen = useUIStore((s) => s.expenseDialogOpen);
  const setStoreOpen = useUIStore((s) => s.setExpenseDialogOpen);

  const open = controlledOpen ?? storeOpen;
  const setOpen = onOpenChange ?? setStoreOpen;

  const isEdit = Boolean(expense);
  const create = useCreateExpense();
  const update = useUpdateExpense();

  const form = useForm<FormValues>({
    defaultValues: {
      description: "",
      amount: 0,
      currency: "USD",
      category: "uncategorized",
      merchant: "",
      occurred_at: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        expense
          ? {
              description: expense.description,
              amount: expense.amount,
              currency: expense.currency,
              category: expense.category,
              merchant: expense.merchant,
              occurred_at: toLocalInput(expense.occurred_at),
              notes: expense.notes,
            }
          : {
              description: "",
              amount: 0,
              currency: "USD",
              category: "uncategorized",
              merchant: "",
              occurred_at: toLocalInput(new Date().toISOString()),
              notes: "",
            },
      );
    }
  }, [open, expense, form]);

  async function onSubmit(values: FormValues) {
    const payload: ExpenseCreate = {
      description: values.description,
      amount: Number(values.amount),
      currency: values.currency || "USD",
      category: values.category,
      merchant: values.merchant,
      notes: values.notes,
      occurred_at: values.occurred_at ? new Date(values.occurred_at).toISOString() : null,
    };
    if (isEdit && expense) {
      await update.mutateAsync({ id: expense.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    setOpen(false);
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "New expense"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update merchant, amount or category."
              : "Log a transaction. Tip: press N anywhere to open this."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" required {...form.register("description", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                {...form.register("amount", { valueAsNumber: true, required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...form.register("currency")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => form.setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="merchant">Merchant</Label>
              <Input id="merchant" {...form.register("merchant")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="occurred_at">Occurred at</Label>
            <Input id="occurred_at" type="datetime-local" {...form.register("occurred_at")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
