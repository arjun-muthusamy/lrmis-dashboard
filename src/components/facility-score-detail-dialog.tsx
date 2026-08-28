import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SCORE_DEFS,
  SCORE_TONE_CLASSES,
  scoreTone,
  type ScoreKey,
  type ScoredFacility,
} from "@/lib/facility-scores";

interface Props {
  facility: ScoredFacility | null;
  deliveries: number;
  onClose: () => void;
}

export function FacilityScoreDetailDialog({ facility, deliveries, onClose }: Props) {
  const [openDomain, setOpenDomain] = useState<ScoreKey | null>("hr");

  return (
    <Dialog open={!!facility} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        {facility && (
          <>
            <DialogHeader>
              <DialogTitle>{facility.facility}</DialogTitle>
              <DialogDescription>
                {facility.type} · {facility.level} · {deliveries} deliveries · {facility.district}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total score
                </div>
                <div className="mt-1 text-3xl font-extrabold text-navy">
                  {facility.total}
                  <span className="text-base text-muted-foreground">/100</span>
                </div>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${SCORE_TONE_CLASSES[scoreTone(facility.total)]}`}
              >
                {scoreTone(facility.total) === "good"
                  ? "Green"
                  : scoreTone(facility.total) === "warn"
                    ? "Amber"
                    : "Red"}
              </span>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Six weighted domains — click each domain for score reasons
              </div>
              <div className="space-y-2">
                {SCORE_DEFS.map((definition) => {
                  const detail = facility.scores[definition.key];
                  const isOpen = openDomain === definition.key;
                  return (
                    <section key={definition.key} className="rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setOpenDomain(isOpen ? null : definition.key)}
                        className="flex w-full items-center gap-3 p-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold text-foreground">
                              {definition.label}
                            </span>
                            <span className="font-bold tabular-nums text-navy">
                              {detail.earned}/{detail.max}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-teal" style={{ width: `${detail.score}%` }} />
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-border bg-secondary/30 p-3">
                          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Related linked parameters{" "}
                            {detail.score >= 65
                              ? "(performing well)"
                              : "(possible drivers of low score)"}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-[10px] uppercase text-muted-foreground">
                                <th className="pb-1 font-medium">Parameter</th>
                                <th className="pb-1 text-right font-medium">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.breakdown.map((item) => (
                                <tr key={item.label} className="border-t border-border/70">
                                  <td className="py-2 text-foreground">{item.label}</td>
                                  <td className="py-2 text-right font-semibold text-foreground">
                                    {item.value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="mt-2 text-[9px] italic text-muted-foreground">
                            Linked parameters reported as-is for user interpretation — not
                            algorithmic causation.
                          </p>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
