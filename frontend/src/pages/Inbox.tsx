import { Inbox, Mail, MessageSquare, RefreshCw, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useIngest, useMail, useMessages } from "@/hooks/useInbox";
import { fmtMoney, fmtRelative } from "@/lib/format";
import type { MailMessage } from "@/types/api";

function MessageCard({ message }: { message: MailMessage }) {
  return (
    <div className="rounded-xl border bg-card/60 p-3 transition-colors hover:bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{message.subject || "(no subject)"}</div>
          <div className="truncate text-xs text-muted-foreground">
            {message.sender}
            {message.received_at ? ` · ${fmtRelative(message.received_at)}` : ""}
          </div>
        </div>
        {message.detected_amount != null && (
          <div className="text-sm font-semibold tabular-nums text-accent">
            {fmtMoney(message.detected_amount)}
          </div>
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
        {message.snippet}
      </div>
      {message.detected_merchant && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
          <Wand2 className="h-3 w-3" /> Detected merchant: {message.detected_merchant}
        </div>
      )}
    </div>
  );
}

interface ColumnProps {
  title: string;
  icon: React.ReactNode;
  items?: MailMessage[];
  loading?: boolean;
  onRefresh: () => void;
  onIngest: () => void;
  ingesting: boolean;
}

function Column({ title, icon, items, loading, onRefresh, onIngest, ingesting }: ColumnProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={onRefresh} aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="gradient" onClick={onIngest} disabled={ingesting}>
            {ingesting ? "Ingesting…" : "Ingest"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {items && items.length === 0 && (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="Nothing here yet"
            description="Connect a Gmail/IMAP/MCP source. Until then we show demo items."
          />
        )}
        {items?.map((m) => <MessageCard key={m.id} message={m} />)}
      </CardContent>
    </Card>
  );
}

export default function InboxPage() {
  const mail = useMail();
  const messages = useMessages();
  const ingestMail = useIngest("mail");
  const ingestMessages = useIngest("messages");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Column
          title="Mail"
          icon={<Mail className="h-4 w-4" />}
          items={mail.data}
          loading={mail.isPending}
          onRefresh={() => mail.refetch()}
          onIngest={() => ingestMail.mutate()}
          ingesting={ingestMail.isPending}
        />
        <Column
          title="Messages"
          icon={<MessageSquare className="h-4 w-4" />}
          items={messages.data}
          loading={messages.isPending}
          onRefresh={() => messages.refetch()}
          onIngest={() => ingestMessages.mutate()}
          ingesting={ingestMessages.isPending}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Connect a Gmail / WhatsApp / iMessage MCP server by setting <code>MCP_MAIL_URL</code> or{" "}
        <code>MCP_MESSAGES_URL</code>. With no credentials the columns show realistic demo data.
      </p>
    </div>
  );
}
