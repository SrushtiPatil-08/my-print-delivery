import { FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

export type Transaction = {
  id: string;
  title: string;
  date: string;
  amount: number;
  status: "delivered" | "in_transit" | "processing";
};

const DEMO: Transaction[] = [
  { id: "PG100234", title: "DBMS Assignment", date: "Today, 2:14 PM", amount: 145, status: "in_transit" },
  { id: "PG100231", title: "Project Report", date: "Yesterday", amount: 285, status: "delivered" },
  { id: "PG100227", title: "Notes Unit 3", date: "2 days ago", amount: 260, status: "delivered" },
  { id: "PG100219", title: "Resume Print", date: "Last week", amount: 40, status: "delivered" },
];

const STATUS_COLOR: Record<Transaction["status"], string> = {
  delivered: "bg-emerald-500/10 text-emerald-600",
  in_transit: "bg-primary/10 text-primary",
  processing: "bg-amber-500/10 text-amber-600",
};

const STATUS_LABEL: Record<Transaction["status"], string> = {
  delivered: "Delivered",
  in_transit: "In transit",
  processing: "Processing",
};

export function RecentTransactions({ items = DEMO }: { items?: Transaction[] }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">Recent Transactions</h3>
      </div>
      <ul className="space-y-3">
        {items.map((t) => (
          <li
            key={t.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/50 bg-background/60 p-3"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">#{t.id}</span>
                <span>·</span>
                <span className="truncate">{t.date}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display font-bold">₹{t.amount}</p>
              <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => trackEvent("buy_again_clicked", { order_id: t.id })}
              className="col-span-3 mt-1 h-8 justify-center gap-1.5 text-xs rounded-xl bg-accent/60 hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Buy again
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
