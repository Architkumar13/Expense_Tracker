import { format, formatDistanceToNow, parseISO } from "date-fns";

export function fmtMoney(value: number | null | undefined, currency = "USD"): string {
  const num = value ?? 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

export function fmtNumber(value: number | null | undefined, fractionDigits = 0): string {
  const num = value ?? 0;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
  }).format(num);
}

export function fmtPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function fmtDate(value: string | Date | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!value) return "";
  const dt = typeof value === "string" ? parseISO(value) : value;
  if (Number.isNaN(dt.getTime())) return "";
  return format(dt, pattern);
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  return fmtDate(value, "MMM d, yyyy · h:mma");
}

export function fmtRelative(value: string | Date | null | undefined): string {
  if (!value) return "";
  const dt = typeof value === "string" ? parseISO(value) : value;
  if (Number.isNaN(dt.getTime())) return "";
  return formatDistanceToNow(dt, { addSuffix: true });
}
