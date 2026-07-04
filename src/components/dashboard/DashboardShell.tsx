import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, Package, History, User, LogOut, Printer, Bell, Search } from "lucide-react";
import { useAuth, signOut } from "@/lib/auth";
import { resetAnalytics, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/dashboard/orders", label: "My Orders", icon: Package },
  { to: "/dashboard/history", label: "Order History", icon: History },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  function isActive(to: string, exact?: boolean) {
    return exact ? location.pathname === to : location.pathname.startsWith(to);
  }

  async function handleSignOut() {
    trackEvent("signout_clicked");
    await signOut();
    resetAnalytics();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/[0.03] via-background to-accent/10">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-border/60 bg-card/60 backdrop-blur p-5 gap-1 z-40">
        <Link to="/" className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Printer className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">PrintOnGo</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" className="lg:hidden flex items-center gap-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Printer className="h-4 w-4" />
                </div>
              </Link>
              <div className="relative hidden sm:block w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders, files…" className="pl-9 h-10 rounded-2xl bg-muted/60 border-transparent" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/60 hover:bg-accent">
                <Bell className="h-4 w-4" />
              </button>
              <div className="lg:hidden grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-sm font-semibold">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
