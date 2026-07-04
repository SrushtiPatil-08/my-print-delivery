import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DEMO = [
  { month: "Jan", spend: 320 },
  { month: "Feb", spend: 410 },
  { month: "Mar", spend: 280 },
  { month: "Apr", spend: 520 },
  { month: "May", spend: 470 },
  { month: "Jun", spend: 680 },
  { month: "Jul", spend: 540 },
  { month: "Aug", spend: 720 },
];

export function SpendingChart({ data = DEMO }: { data?: { month: string; spend: number }[] }) {
  const total = data.reduce((s, d) => s + d.spend, 0);
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Spending analytics</h3>
          <p className="text-sm text-muted-foreground">Your monthly printing trend</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">This year</p>
          <p className="font-display text-xl font-bold">₹{total.toLocaleString()}</p>
        </div>
      </div>
      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis tickLine={false} axisLine={false} width={40} className="text-xs" />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                fontSize: 12,
              }}
              formatter={(v: number) => [`₹${v}`, "Spend"]}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="oklch(0.52 0.22 257)"
              strokeWidth={2.5}
              fill="url(#spendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
