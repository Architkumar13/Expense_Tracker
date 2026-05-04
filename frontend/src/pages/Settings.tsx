import { CheckCircle2, Circle, Sparkles, ShieldAlert, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useHealth } from "@/hooks/useHealth";
import { useClearChat } from "@/hooks/useAdvisor";
import { useThemeStore, type Theme } from "@/store/theme";
import { cn } from "@/lib/utils";

const THEMES: Theme[] = ["light", "dark", "system"];

export default function SettingsPage() {
  const health = useHealth();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const clearChat = useClearChat();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <p className="text-xs text-muted-foreground">Pick a theme. System follows your OS.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {THEMES.map((t) => (
            <Button
              key={t}
              variant={theme === t ? "gradient" : "outline"}
              size="sm"
              className="capitalize"
              onClick={() => setTheme(t)}
            >
              {t}
            </Button>
          ))}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <p className="text-xs text-muted-foreground">
            Configure these in <code>backend/.env</code>. Reload after changes.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {health.isPending && <Skeleton className="h-24 w-full" />}
          {health.data && (
            <ul className="grid gap-2 sm:grid-cols-2">
              <Flag label="Claude AI" ok={health.data.ai_enabled} hint="ANTHROPIC_API_KEY" />
              <Flag label="MCP Mail" ok={health.data.mcp_mail} hint="MCP_MAIL_URL" />
              <Flag label="MCP Messages" ok={health.data.mcp_messages} hint="MCP_MESSAGES_URL" />
              <Flag label="IMAP" ok={health.data.imap_configured} hint="IMAP_HOST/USER/PASSWORD" />
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Advisor
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Reset the AI advisor's chat history.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => clearChat.mutate()}>
            <Trash2 className="h-4 w-4" /> Clear chat history
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-4 w-4" /> Danger zone
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Delete the local SQLite database to wipe all data. (Run manually:{" "}
            <code>rm backend/data/expenses.db</code> then restart the server.)
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We don't expose a one-click wipe in the UI to prevent accidents. The DB lives at{" "}
            <code>backend/data/expenses.db</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Flag({ label, ok, hint }: { label: string; ok: boolean; hint: string }) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border bg-card/40 px-3 py-2 text-sm",
        ok && "border-success/40",
      )}
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium">{label}</span>
      </div>
      <code className="text-xs text-muted-foreground">{hint}</code>
    </li>
  );
}
