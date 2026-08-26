import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";

export interface Filters {
  period: string; // "May 2026"
  levels: string[]; // L1/L2/L3
  facilityTypes: string[];
  division?: string;
  district?: string;
  block?: string;
  facility?: string;
}

const DEFAULT_FILTERS: Filters = {
  period: "May 2026",
  levels: [],
  facilityTypes: [],
};

interface FilterCtx {
  filters: Filters;
  setFilters: (f: Filters) => void;
  reset: () => void;
  activeCount: number;
}

const Ctx = createContext<FilterCtx | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [filters, setFiltersRaw] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    division: user?.division,
    district: user?.district,
    block: user?.block,
  }));

  const setFilters = (f: Filters) => {
    // Enforce locked filters from auth
    if (user?.level === "district" || user?.level === "block") {
      f.district = user.district;
      f.division = user.division;
    }
    if (user?.level === "block") f.block = user.block;
    setFiltersRaw(f);
  };

  const reset = () =>
    setFiltersRaw({
      ...DEFAULT_FILTERS,
      division: user?.division,
      district: user?.district,
      block: user?.block,
    });

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.levels.length) n++;
    if (filters.facilityTypes.length) n++;
    if (filters.division && user?.level === "state") n++;
    if (filters.district && user?.level !== "district" && user?.level !== "block") n++;
    if (filters.block && user?.level !== "block") n++;
    if (filters.facility) n++;
    return n;
  }, [filters, user]);

  return <Ctx.Provider value={{ filters, setFilters, reset, activeCount }}>{children}</Ctx.Provider>;
}

export function useFilters(): FilterCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFilters must be inside FilterProvider");
  return v;
}
