import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Package } from "lucide-react";
import { getOrders } from "@/lib/order-store";
import { LiveTrackingMap } from "@/components/dashboard/LiveTrackingMap";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const orders = typeof window !== "undefined" ? getOrders() : [];
  const active = orders.filter((o) => o.status !== "Delivered");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Track ongoing prints through every pipeline stage.</p>
      </header>

      {active[0] && (
        <LiveTrackingMap
          orderId={active[0].id}
          initialStatus={active[0].status === "Out For Delivery" ? "out_for_delivery" : "processing"}
        />
      )}

      <div className="grid gap-3">
        {active.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted mb-3">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium">No active orders</p>
            <p className="text-sm text-muted-foreground mt-1">Place your next print in under a minute.</p>
            <Link to="/order" className="inline-flex mt-4 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-sm font-medium">
              New order
            </Link>
          </div>
        )}
        {active.map((o) => (
          <div key={o.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{o.options.fileName || "Print order"}</p>
              <p className="truncate text-xs text-muted-foreground">
                #{o.id} · {o.options.pages} pages × {o.options.copies}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold">₹{o.total}</p>
              <span className="text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5">{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
