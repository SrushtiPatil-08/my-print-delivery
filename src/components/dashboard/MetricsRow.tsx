import { ShoppingBag, ShoppingCart, Truck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
  icon: any;
  accent: string;
  action?: { label: string; to: string };
};

export function MetricsRow({
  totalOrders,
  cartItems,
  activeDeliveries,
  deltaPct = 12,
}: {
  totalOrders: number;
  cartItems: number;
  activeDeliveries: number;
  deltaPct?: number;
}) {
  const metrics: Metric[] = [
    {
      label: "Total Orders Placed",
      value: totalOrders,
      delta: `${deltaPct > 0 ? "+" : ""}${deltaPct}% vs last month`,
      trend: deltaPct >= 0 ? "up" : "down",
      icon: ShoppingBag,
      accent: "from-primary/15 to-primary/5 text-primary",
    },
    {
      label: "Items in Cart",
      value: cartItems,
      icon: ShoppingCart,
      accent: "from-amber-500/15 to-amber-500/5 text-amber-600",
      action: { label: "Finish checkout", to: "/order" },
    },
    {
      label: "Active Deliveries",
      value: activeDeliveries,
      icon: Truck,
      accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
      action: { label: "Track now", to: "/dashboard/orders" },
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
        >
          <div className="flex items-start justify-between gap-3">
            <div className={cn("grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br", m.accent)}>
              <m.icon className="h-5 w-5" />
            </div>
            {m.trend && (
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  m.trend === "up" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive",
                )}
              >
                {m.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {m.delta}
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{m.value}</p>
          </div>
          {m.action && (
            <Link
              to={m.action.to as any}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {m.action.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
