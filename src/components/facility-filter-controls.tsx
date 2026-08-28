import { Check, SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INTERSECTIONS } from "@/lib/intersections";
import { CHIP_DEFS, type AnalysisMode, type ChipKey } from "@/lib/facility-map-filters";

interface Props {
  analysis: AnalysisMode;
  chips: ChipKey[];
  onAnalysisChange: (analysis: AnalysisMode) => void;
  onChipsChange: (chips: ChipKey[]) => void;
}

export function FacilityFilterControls({
  analysis,
  chips,
  onAnalysisChange,
  onChipsChange,
}: Props) {
  const setAnalysis = (value: AnalysisMode) => {
    onAnalysisChange(value);
  };
  const toggleChip = (key: ChipKey) => {
    onChipsChange(chips.includes(key) ? chips.filter((item) => item !== key) : [...chips, key]);
  };
  const activeAnalysisLabel =
    analysis === "supervision"
      ? "Supervision required"
      : analysis === "maternalDeaths"
        ? "Maternal deaths"
        : analysis === "neonatalDeaths"
          ? "Neonatal deaths"
          : analysis.startsWith("intersection:")
            ? INTERSECTIONS.find((preset) => `intersection:${preset.key}` === analysis)?.label
            : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4 text-teal" />
            Filter facilities
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Select one focus or combine parameter chips. Only matching facility pins and rows
            remain.
          </p>
        </div>
        {(analysis !== "none" || chips.length > 0) && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-soft/50 px-2.5 py-1 text-[10px] font-semibold text-teal">
              {activeAnalysisLabel ?? `${chips.length} parameters`} active
            </span>
            <button
              type="button"
              onClick={() => onAnalysisChange("none")}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Operational focus
          </span>
          <Select
            value={analysis === "supervision" ? analysis : ""}
            onValueChange={(value) => setAnalysis(value as AnalysisMode)}
          >
            <SelectTrigger className="h-9 w-full bg-white text-xs">
              <SelectValue placeholder="No focus selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supervision" className="text-xs">
                Supervision required
              </SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Mortality signal
          </span>
          <Select
            value={analysis === "maternalDeaths" || analysis === "neonatalDeaths" ? analysis : ""}
            onValueChange={(value) => setAnalysis(value as AnalysisMode)}
          >
            <SelectTrigger className="h-9 w-full bg-white text-xs">
              <SelectValue placeholder="No mortality signal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maternalDeaths" className="text-xs">
                Maternal deaths reported
              </SelectItem>
              <SelectItem value="neonatalDeaths" className="text-xs">
                Neonatal deaths reported
              </SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Intersection preset
          </span>
          <Select
            value={analysis.startsWith("intersection:") ? analysis : ""}
            onValueChange={(value) => setAnalysis(value as AnalysisMode)}
          >
            <SelectTrigger className="h-9 w-full bg-white text-xs">
              <SelectValue placeholder="No preset selected" />
            </SelectTrigger>
            <SelectContent>
              {INTERSECTIONS.map((preset) => (
                <SelectItem
                  key={preset.key}
                  value={`intersection:${preset.key}`}
                  className="text-xs"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Parameter chips
            </div>
            <div className="text-[10px] text-muted-foreground">
              Combine conditions to narrow to the same facility pins.
            </div>
          </div>
          {chips.length > 0 && (
            <button
              type="button"
              onClick={() => onChipsChange([])}
              className="text-[10px] font-medium text-teal hover:underline"
            >
              Clear chips ({chips.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CHIP_DEFS.map((chip) => {
            const active = chips.includes(chip.key);
            const activeClass =
              chip.tone === "green"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : chip.tone === "amber"
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-rose-600 bg-rose-600 text-white";
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => toggleChip(chip.key)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? activeClass
                    : "border-border bg-white text-muted-foreground hover:border-teal/40 hover:bg-teal-soft/30"
                }`}
              >
                {active && <Check className="h-3 w-3" />}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
