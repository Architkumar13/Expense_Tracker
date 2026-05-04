import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmtMoney } from "@/lib/format";

const COLORS = [
  "hsl(256 85% 65%)",
  "hsl(174 70% 50%)",
  "hsl(38 95% 60%)",
  "hsl(330 80% 65%)",
  "hsl(152 60% 50%)",
  "hsl(210 90% 60%)",
  "hsl(0 75% 65%)",
  "hsl(280 60% 65%)",
];

interface Props {
  data: Record<string, number>;
}

export function CategoryDonut({ data }: Props) {
  const entries = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (entries.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No spending recorded yet.
      </div>
    );
  }

  const total = entries.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={1.5}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {entries.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value: number) => fmtMoney(value)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="text-lg font-semibold">{fmtMoney(total)}</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {entries.slice(0, 6).map((e, i) => (
          <li key={e.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="capitalize">{e.name}</span>
            </div>
            <span className="font-medium tabular-nums">{fmtMoney(e.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
