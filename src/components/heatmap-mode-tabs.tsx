import { Layers3, Map, Skull } from "lucide-react";
import type { HeatmapMode } from "@/lib/heatmap-data";

interface Props {
  value: HeatmapMode;
  onChange: (value: HeatmapMode) => void;
}

const OPTIONS = [
  { value: "delivery", label: "Delivery volume", icon: Map },
  { value: "mortality", label: "Mortality deaths", icon: Skull },
  { value: "combined", label: "Combined", icon: Layers3 },
] as const;

export function HeatmapModeTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-border bg-secondary/50 p-1">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[11px] font-semibold transition ${
              active
                ? "bg-white text-navy shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
