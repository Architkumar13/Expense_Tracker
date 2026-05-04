import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/types/api";
import type { ExpenseFilters as Filters } from "@/hooks/useExpenses";

const SOURCES = ["all", "manual", "receipt", "mail", "message"];

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export function ExpenseFilters({ value, onChange }: Props) {
  function patch(next: Partial<Filters>) {
    onChange({ ...value, ...next, cursor: undefined });
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search description, merchant, notes…"
          className="pl-9"
          value={value.q || ""}
          onChange={(e) => patch({ q: e.target.value || undefined })}
        />
      </div>
      <Select
        value={value.category || "all"}
        onValueChange={(v) => patch({ category: v === "all" ? undefined : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} className="capitalize">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.source || "all"}
        onValueChange={(v) => patch({ source: v === "all" ? undefined : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {SOURCES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s === "all" ? "All sources" : s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={value.start ? value.start.slice(0, 10) : ""}
        onChange={(e) => patch({ start: e.target.value ? `${e.target.value}T00:00:00` : undefined })}
      />
      <Input
        type="date"
        value={value.end ? value.end.slice(0, 10) : ""}
        onChange={(e) => patch({ end: e.target.value ? `${e.target.value}T23:59:59` : undefined })}
      />
    </div>
  );
}
