import { Lock, ChevronRight, Menu } from "lucide-react";
import { FilterPanel } from "./filter-panel";
import lrmislogo from "@/assets/lrmis_logo.png";

const CRUMBS: Record<string, string> = {
  "/overview": "Overview & Rankings",
  "/ai-assistant": "AI Query Assistant",
  "/facility-hr": "Facility & Infrastructure",
  "/hr": "Human Resources",
  "/drugs-referrals": "Drugs, Consumables & Equipment",
  "/referrals": "Referrals",
  "/outcomes": "Outcome Indicators",
  "/obs-hdu": "Obs HDU",
  "/app-utility": "App Utility",
  "/reports": "Reports",
  "/admin": "Admin",
  "/settings": "Branding Settings",
};

export function TopBar({
  pathname,
  collapsed,
  setCollapsed,
}: {
  pathname: string;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const title = Object.entries(CRUMBS).find(([p]) => pathname.startsWith(p))?.[1] ?? "Dashboard";
  const isAI = pathname.startsWith("/ai-assistant");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-muted cursor-pointer"
          aria-label="Open menu"
          onClick={() => setCollapsed((c) => !c)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          {" "}
          <img
            src={lrmislogo}
            alt={"LRMIS logo"}
            className="h-auto w-36 shrink-0 object-contain"
          />{" "}
          <div className="flex flex-col">
            <div className="text-lg font-semibold leading-tight">
              Labour Room Management Information System
            </div>
          </div>
        </div>

        {/* <div className="w-[1px] h-9 bg-gray-300"></div> */}
      </div>

      {/* <nav className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-navy">LRMIS</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">{title}</span>
      </nav> */}

      <div className="flex items-center gap-3">
        {!isAI && (
          <div className="flex items-center gap-1.5 rounded-md border border-navy/15 bg-navy/5 px-2.5 py-1.5 text-xs font-semibold text-navy">
            <Lock className="h-3 w-3" /> Period: May 2026
          </div>
        )}

        {!isAI && <FilterPanel />}

        <div className="grid h-9 w-9 place-items-center rounded-full bg-teal text-xs font-bold text-teal-foreground">
          AK
        </div>
      </div>
    </header>
  );
}
