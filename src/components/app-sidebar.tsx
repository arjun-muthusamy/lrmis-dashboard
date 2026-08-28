import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Building2,
  Users,
  Pill,
  ArrowLeftRight,
  HeartPulse,
  Bot,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Wrench,
  Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/overview", label: "Overview", icon: BarChart3, stateOnly: false },
  { to: "/outcomes", label: "Outcome Indicators", icon: HeartPulse, stateOnly: false },
  { to: "/referrals", label: "Referrals", icon: ArrowLeftRight, stateOnly: false },
  { to: "/drugs-referrals", label: "Stock Reports", icon: Pill, stateOnly: false },
  { to: "/obs-hdu", label: "Obs HDU", icon: HeartPulse, stateOnly: false },
  { to: "/facility-hr", label: "Facility & Infrastructure", icon: Building2, stateOnly: false },
  { to: "/hr", label: "Human Resources", icon: Users, stateOnly: false },
  { to: "/ai-assistant", label: "AI Query Assistant", icon: Bot, stateOnly: false },
  { to: "/app-utility", label: "App Utility", icon: Wrench, stateOnly: false },
  { to: "/reports", label: "Reports", icon: FileText, stateOnly: false },
  { to: "/admin", label: "Admin Panel", icon: Settings, stateOnly: true },
  { to: "/settings", label: "Settings", icon: Settings, stateOnly: false },
] as const;

export function AppSidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside
      className={`relative flex h-[calc(100vh-4rem)] flex-col bg-sidebar text-sidebar-foreground transition-all ${collapsed ? "w-16" : "w-56"}`}
    >
      {/* <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal text-teal-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-lg font-extrabold leading-none text-sidebar-foreground">LRMIS</div>
            <div className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              NHM Madhya Pradesh
            </div>
          </div>
        )}
      </div> */}

      {/* <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-2 top-5 z-[100] grid h-6 w-6 place-items-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow cursor-pointer"
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button> */}

      <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {NAV.filter((n) => !n.stateOnly || user?.level === "state").map(
          ({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-l-[3px] border-teal bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-teal" : ""}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          },
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate">
              <span className="text-sm font-medium text-sidebar-foreground">John Doe</span>

              <span className="mx-2 text-sidebar-foreground/30">•</span>

              <span className="inline-flex items-center rounded-md border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/70">
                {user?.level}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={logout}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
