import { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReceipts, useUploadReceipt } from "@/hooks/useReceipts";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UploadEntry {
  id: string;
  name: string;
  status: "uploading" | "ok" | "error";
  detail?: string;
}

export default function ReceiptsPage() {
  const upload = useUploadReceipt();
  const list = useReceipts();
  const [over, setOver] = useState(false);
  const [log, setLog] = useState<UploadEntry[]>([]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      for (const file of Array.from(files)) {
        const id = crypto.randomUUID();
        setLog((cur) => [{ id, name: file.name, status: "uploading" }, ...cur]);
        try {
          const expense = await upload.mutateAsync(file);
          setLog((cur) =>
            cur.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    status: "ok",
                    detail: `${expense.merchant || "Receipt"} · ${fmtMoney(
                      expense.amount,
                      expense.currency,
                    )} · ${expense.category}`,
                  }
                : entry,
            ),
          );
        } catch (err) {
          setLog((cur) =>
            cur.map((entry) =>
              entry.id === id
                ? { ...entry, status: "error", detail: (err as Error).message }
                : entry,
            ),
          );
        }
      }
    },
    [upload],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Drop receipt PDFs</CardTitle>
          <p className="text-xs text-muted-foreground">
            Text is extracted with pdfplumber, then refined by Claude (when the API key is
            configured) into merchant, total, currency and category.
          </p>
        </CardHeader>
        <CardContent>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              if (e.dataTransfer?.files?.length) void handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-14 text-center cursor-pointer transition-all",
              over ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/30",
            )}
          >
            <input
              type="file"
              accept="application/pdf"
              multiple
              hidden
              onChange={(e) => e.target.files && void handleFiles(e.target.files)}
            />
            <div className="grid h-12 w-12 place-items-center rounded-full gradient-bg text-white shadow-md shadow-primary/30">
              <Upload className="h-5 w-5" />
            </div>
            <div className="font-semibold">Drop PDF or click to browse</div>
            <div className="text-xs text-muted-foreground">Multiple files supported</div>
          </label>

          {log.length > 0 && (
            <ul className="mt-4 space-y-2">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border bg-card/40 p-3 text-sm",
                    entry.status === "ok" && "border-success/40",
                    entry.status === "error" && "border-destructive/40",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {entry.status === "ok" && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {entry.status === "error" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {entry.status === "uploading" && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                    <span className="truncate font-medium">{entry.name}</span>
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{entry.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past receipts</CardTitle>
          <p className="text-xs text-muted-foreground">Most recent first.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {list.isPending && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          {list.data && list.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No receipts uploaded yet.</p>
          )}
          {list.data?.map((r) => {
            let parsed: Record<string, unknown> = {};
            try {
              parsed = JSON.parse(r.parsed_json || "{}");
            } catch {
              parsed = {};
            }
            const merchant = (parsed.merchant as string) || "—";
            const total = Number(parsed.total) || 0;
            const currency = (parsed.currency as string) || "USD";
            const category = (parsed.category as string) || "uncategorized";
            return (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-xl border bg-card/40 p-3"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="truncate text-sm font-medium">{r.filename}</div>
                    <div className="font-semibold tabular-nums">{fmtMoney(total, currency)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {merchant} · <span className="capitalize">{category}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Uploaded {fmtRelative(r.uploaded_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
        <div className="px-5 pb-5">
          <Button variant="ghost" size="sm" onClick={() => list.refetch()}>
            Refresh
          </Button>
        </div>
      </Card>
    </div>
  );
}
