import { Info, type LucideIcon } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import type { IndicatorKey } from "@/lib/indicator-definitions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: { value: string; positive?: boolean };
  info?: string;
  indicator?: IndicatorKey;
  onClick?: () => void;
  /** When provided, renders multiple values stacked vertically with sub-labels */
  breakdown?: Array<{ label: string; value: string | number }>;
}

export function StatCard({ icon: Icon, value, label, trend, info, indicator, onClick, breakdown }: StatCardProps) {
  const Wrapper: React.ElementType = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`relative w-full rounded-xl border border-border bg-card p-5 text-left shadow-sm transition hover:shadow-md ${
        onClick ? "cursor-pointer hover:border-teal/40" : ""
      }`}
    >
      <div className="absolute inset-y-3 left-0 w-[3px] rounded-r bg-teal" />
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-soft text-teal">
          <Icon className="h-4 w-4" />
        </div>
        {indicator ? (
          <InfoTooltip indicator={indicator} />
        ) : info ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground hover:text-foreground"><Info className="h-3.5 w-3.5" /></span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs"><p className="text-xs">{info}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>

      {breakdown ? (
        <div className="mt-3 space-y-1">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{b.label}</span>
              <span className="text-lg font-bold tabular-nums text-foreground">{b.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
      )}
      <div className="mt-1 text-[13px] font-medium text-muted-foreground">{label}</div>
      {trend && (
        <div className={`mt-2 text-xs font-semibold ${trend.positive ? "text-chart-emerald" : "text-chart-rose"}`}>
          {trend.positive ? "↑" : "↓"} {trend.value} vs Apr 2026
        </div>
      )}
    </Wrapper>
  );
}
