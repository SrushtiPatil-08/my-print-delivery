import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LiveTrackingMap } from "@/components/dashboard/LiveTrackingMap";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useAuth } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    trackEvent("dashboard_viewed");
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold truncate">Hi {name} 👋</h1>
        </div>
      </header>

      <MetricsRow totalOrders={24} cartItems={2} activeDeliveries={1} deltaPct={18} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <LiveTrackingMap
            orderId="PG100234"
            initialStatus="out_for_delivery"
            courier={{ lat: 19.3899, lng: 72.8299 }}
          />
          <SpendingChart />
        </div>
        <div className="lg:col-span-1">
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}
