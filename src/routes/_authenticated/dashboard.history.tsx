import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { getOrders } from "@/lib/order-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const orders = typeof window !== "undefined" ? getOrders() : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">Every invoice, receipt, and past order.</p>
      </header>

      <div className="rounded-3xl border border-border/60 bg-card shadow-soft overflow-hidden">
        <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div>Order</div>
          <div>Date</div>
          <div>Items</div>
          <div>Total</div>
          <div></div>
        </div>
        <ul className="divide-y divide-border/60">
          {orders.map((o) => (
            <li key={o.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
              <div className="flex items-center gap-3 min-w-0 sm:col-span-1 col-span-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent">
                  <FileText className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm">{o.options.fileName || "Print order"}</p>
                  <p className="truncate text-xs text-muted-foreground">#{o.id}</p>
                </div>
              </div>
              <div className="hidden sm:block text-sm text-muted-foreground">
                {new Date(o.createdAt).toLocaleDateString()}
              </div>
              <div className="hidden sm:block text-sm">
                {o.options.pages} × {o.options.copies}
              </div>
              <div className="text-right sm:text-left font-bold">₹{o.total}</div>
              <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 text-xs col-span-3 sm:col-span-1 justify-center">
                <Download className="h-3.5 w-3.5" />
                Invoice
              </Button>
            </li>
          ))}
          {orders.length === 0 && (
            <li className="p-10 text-center text-sm text-muted-foreground">No orders yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
