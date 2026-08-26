import { useState } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIVISIONS, BLOCKS_OF, ALL_DISTRICTS, DIVISION_OF } from "@/lib/districts";
import { SAMPLE_FACILITIES } from "@/lib/mock-data";
import { useFilters, type Filters } from "@/lib/filter-context";
import { useAuth } from "@/lib/auth-context";

const LEVELS = ["L1", "L2", "L3"];
const TYPES = ["DH", "CHC", "PHC", "SHC", "SC"];
const PERIODS = [
  "May 2026",
  "Apr 2026",
  "Mar 2026",
  "Feb 2026",
  "Jan 2026",
  "Dec 2025",
  "Nov 2025",
  "Oct 2025",
  "Sep 2025",
  "Aug 2025",
  "Jul 2025",
  "Jun 2025",
];

export function FilterPanel() {
  const { filters, setFilters, reset, activeCount } = useFilters();
  const { user } = useAuth();
  const [draft, setDraft] = useState<Filters>(filters);
  const [open, setOpen] = useState(false);

  const onOpen = (o: boolean) => {
    if (o) setDraft(filters);
    setOpen(o);
  };

  const districtLocked = user?.level === "district" || user?.level === "block";
  const blockLocked = user?.level === "block";
  const divisionLocked = districtLocked;

  const divDistricts = draft.division
    ? (DIVISIONS.find((d) => d.name === draft.division)?.districts ?? [])
    : ALL_DISTRICTS;
  const blocks = draft.district ? (BLOCKS_OF[draft.district] ?? []) : [];
  const facilities = SAMPLE_FACILITIES.filter(
    (f) => !draft.district || f.district === draft.district,
  );

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <Sheet open={open} onOpenChange={onOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border text-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-teal px-1 text-[10px] font-bold text-teal-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:max-w-none">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="text-base font-semibold text-navy">Filter Data</SheetTitle>
        </SheetHeader>

        <div className="flex h-[calc(100%-7rem)] flex-col gap-5 overflow-y-auto p-4">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Period</Label>
            <Select value={draft.period} onValueChange={(v) => setDraft({ ...draft, period: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Facility Level
            </Label>
            <div className="mt-2 flex gap-4">
              {LEVELS.map((l) => (
                <label key={l} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.levels.includes(l)}
                    onCheckedChange={() => setDraft({ ...draft, levels: toggle(draft.levels, l) })}
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Facility Type
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.facilityTypes.includes(t)}
                    onCheckedChange={() =>
                      setDraft({ ...draft, facilityTypes: toggle(draft.facilityTypes, t) })
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Division
            </Label>
            <Select
              value={draft.division ?? ""}
              onValueChange={(v) =>
                setDraft({ ...draft, division: v, district: undefined, block: undefined })
              }
              disabled={divisionLocked}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All divisions" />
              </SelectTrigger>
              <SelectContent>
                {DIVISIONS.map((d) => (
                  <SelectItem key={d.name} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              District
            </Label>
            <Select
              value={draft.district ?? ""}
              onValueChange={(v) => {
                const div = DIVISION_OF[v];
                setDraft({
                  ...draft,
                  district: v,
                  division: draft.division ?? div,
                  block: undefined,
                });
              }}
              disabled={districtLocked}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All districts" />
              </SelectTrigger>
              <SelectContent>
                {divDistricts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Block</Label>
            <Select
              value={draft.block ?? ""}
              onValueChange={(v) => setDraft({ ...draft, block: v })}
              disabled={blockLocked || !draft.district}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All blocks" />
              </SelectTrigger>
              <SelectContent>
                {blocks.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Facility
            </Label>
            <Select
              value={draft.facility ?? ""}
              onValueChange={(v) => setDraft({ ...draft, facility: v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All facilities" />
              </SelectTrigger>
              <SelectContent>
                {facilities.slice(0, 50).map((f) => (
                  <SelectItem key={f.facility} value={f.facility}>
                    {f.facility} · {f.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-2 border-t bg-white p-4">
          <Button
            className="h-10 w-full bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={() => {
              setFilters(draft);
              setOpen(false);
            }}
          >
            Apply Filters
          </Button>
          <button
            onClick={() => {
              reset();
              setDraft({ period: "May 2026", levels: [], facilityTypes: [] });
            }}
            className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset to Default
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-teal" />
      <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">{title}</h2>
      <div className="ml-2 h-px flex-1 bg-border" />
    </div>
  );
}

export { X };
