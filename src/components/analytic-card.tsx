import { Info, TrendingUp, type LucideIcon } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";
import type { IndicatorKey } from "@/lib/indicator-definitions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type AnalyticCardColor =
  | "blue"
  | "orange"
  | "purple"
  | "teal"
  | "red"
  | "green"
  | "pink"
  | "indigo"
  | "amber"
  | "gray";

const PALETTE: Record<
  AnalyticCardColor,
  { accent: string; text: string; wash: string; tint: string }
> = {
  blue: {
    accent: "#2563EB",
    text: "#1E40AF",
    wash: "rgba(37,99,235,0.08)",
    tint: "rgba(37,99,235,0.12)",
  },
  orange: {
    accent: "#EA580C",
    text: "#C2410C",
    wash: "rgba(234,88,12,0.08)",
    tint: "rgba(234,88,12,0.12)",
  },
  purple: {
    accent: "#7C3AED",
    text: "#6D28D9",
    wash: "rgba(124,58,237,0.08)",
    tint: "rgba(124,58,237,0.12)",
  },
  teal: {
    accent: "#0D9488",
    text: "#0F766E",
    wash: "rgba(13,148,136,0.08)",
    tint: "rgba(13,148,136,0.12)",
  },
  red: {
    accent: "#DC2626",
    text: "#B91C1C",
    wash: "rgba(220,38,38,0.08)",
    tint: "rgba(220,38,38,0.12)",
  },
  green: {
    accent: "#16A34A",
    text: "#15803D",
    wash: "rgba(22,163,74,0.08)",
    tint: "rgba(22,163,74,0.12)",
  },
  pink: {
    accent: "#BE185D",
    text: "#9D174D",
    wash: "rgba(190,24,93,0.08)",
    tint: "rgba(190,24,93,0.12)",
  },
  indigo: {
    accent: "#4F46E5",
    text: "#4338CA",
    wash: "rgba(79,70,229,0.08)",
    tint: "rgba(79,70,229,0.12)",
  },
  amber: {
    accent: "#D97706",
    text: "#B45309",
    wash: "rgba(217,119,6,0.08)",
    tint: "rgba(217,119,6,0.12)",
  },
  gray: {
    accent: "#6B7280",
    text: "#374151",
    wash: "rgba(107,114,128,0.08)",
    tint: "rgba(107,114,128,0.12)",
  },
};

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  statLabel?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  info?: string;
  indicator?: IndicatorKey;
  onClick?: () => void;

  /** Selects the light gradient palette this card is themed with. Defaults to "teal". */
  color?: AnalyticCardColor;

  /** Renders multiple values stacked vertically with sub-labels */
  breakdown?: Array<{
    label: string;
    value: string | number;
  }>;

  /** Makes the primary value larger */
  emphasis?: boolean;
}

export function AnalyticCard({
  icon: Icon,
  value,
  label,
  statLabel,
  trend,
  info,
  indicator,
  onClick,
  color = "teal",
  breakdown,
  emphasis = false,
}: StatCardProps) {
  const Wrapper: React.ElementType = onClick ? "button" : "div";
  const pal = PALETTE[color];

  return (
    <Wrapper
      onClick={onClick}
      style={{
        backgroundImage: `linear-gradient(135deg, ${pal.wash} 0%, transparent 65%)`,
      }}
      className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-black/[0.06] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Left accent rail */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: pal.accent }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-gray-500">{label}</span>
          {indicator ? (
            <InfoTooltip indicator={indicator} className="shrink-0" />
          ) : info ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0 text-gray-400 hover:text-gray-600">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>

                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>

        {/* Icon badge */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: pal.tint, color: pal.accent }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      {/* Value / Breakdown */}
      <div className="mt-2 pl-2">
        {breakdown ? (
          <div className="space-y-1">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  {item.label}
                </span>

                <span className="text-lg font-bold tabular-nums" style={{ color: pal.text }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span
              className={`font-bold tabular-nums leading-none ${emphasis ? "text-3xl" : "text-2xl"}`}
              style={{ color: pal.text }}
            >
              {value}
            </span>
            {trend && <Trend value={trend.value} positive={!!trend.positive} color={pal.accent} />}
          </div>
        )}
        {statLabel && (
          <span className="mt-1 block text-[12px] font-medium text-gray-400">{statLabel}</span>
        )}
      </div>
    </Wrapper>
  );
}

function Trend({ value, positive, color }: { value: string; positive: boolean; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
      style={{ color: positive ? color : "#9CA3AF" }}
    >
      <TrendingUp className={`h-3 w-3 ${positive ? "" : "rotate-180 opacity-60"}`} />
      {value}
    </span>
  );
}
