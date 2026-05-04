import {
  Apple,
  CarFront,
  Coffee,
  Cross,
  CreditCard,
  Film,
  Plane,
  Plug,
  ShoppingBag,
  Sparkles,
  Tag,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PALETTE: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  groceries: { icon: Apple, cls: "bg-emerald-500/15 text-emerald-500" },
  dining: { icon: Coffee, cls: "bg-amber-500/15 text-amber-500" },
  travel: { icon: Plane, cls: "bg-sky-500/15 text-sky-500" },
  transport: { icon: CarFront, cls: "bg-cyan-500/15 text-cyan-500" },
  utilities: { icon: Plug, cls: "bg-yellow-500/15 text-yellow-500" },
  shopping: { icon: ShoppingBag, cls: "bg-pink-500/15 text-pink-500" },
  healthcare: { icon: Cross, cls: "bg-red-500/15 text-red-500" },
  entertainment: { icon: Film, cls: "bg-violet-500/15 text-violet-500" },
  subscription: { icon: CreditCard, cls: "bg-fuchsia-500/15 text-fuchsia-500" },
  fees: { icon: Wrench, cls: "bg-orange-500/15 text-orange-500" },
  other: { icon: Tag, cls: "bg-slate-500/15 text-slate-500" },
  uncategorized: { icon: Sparkles, cls: "bg-muted text-muted-foreground" },
};

export function CategoryPill({ category, className }: { category: string; className?: string }) {
  const cfg = PALETTE[category] || PALETTE.uncategorized;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        cfg.cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {category || "uncategorized"}
    </span>
  );
}
