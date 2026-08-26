import { useMemo, useState } from "react";
import { Download, Users2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCSV } from "@/lib/csv";
import { SAMPLE_FACILITIES } from "@/lib/mock-data";
import { REFERRAL_IN_BY_LEVEL, REFERRAL_OUT_BY_LEVEL } from "@/lib/mock-extra";

type Lvl = "L1" | "L2" | "L3";
type Kind = "in" | "out";

interface ReferralRow {
  facility: string;
  district: string;
  type: string;
  rate: number;
  primaryReason: string;
  secondaryReason: string;
}

const REF_OUT_REASONS: Record<Lvl, string[]> = {
  L1: [
    "Oxytocin stockout (5d)",
    "Magnesium Sulphate stockout (9d)",
    "Inj. Vitamin K stockout",
    "Iron Sucrose stockout (11d)",
    "Baby warmer not functional",
    "Suction machine not functional",
    "Staff nurse vacancy",
    "SBA-trained nurse absent on shift",
    "Partograph not maintained",
    "Resuscitation kit incomplete",
  ],
  L2: [
    "Oxytocin stockout (5d)",
    "Magnesium Sulphate stockout (9d)",
    "MO-EmOC trained absent",
    "OT light not functional",
    "Anaesthetist not on roster",
    "Blood storage unit non-functional",
    "Staff nurse vacancy",
    "Baby warmer not functional",
    "Suction machine not functional",
    "Functional newborn corner gap",
  ],
  L3: [
    "Gynaecologist not on roster",
    "Paediatrician not on roster",
    "Anaesthetist not on roster",
    "Blood bank non-functional",
    "108 ambulance unavailable",
    "OT downtime",
    "NICU bed shortage",
    "Obstetric HDU full",
    "Sepsis kit stockout",
    "USG machine downtime",
  ],
};

const REF_IN_REASONS: Record<Lvl, string[]> = {
  L1: [
    "Diversion by 108 to higher facility",
    "Patient awareness gap",
    "Weak ANM-PHC linkage",
    "Distance / connectivity",
    "Drug stockouts deterring referrals",
    "Reporting gap",
    "Staff nurse vacancy",
    "No SBA on night shift",
  ],
  L2: [
    "Underutilized FRU capacity",
    "Drug stockouts deterring referrals",
    "Equipment downtime (OT light)",
    "MO-EmOC trained absent",
    "Weak referral linkages from L1",
    "Patient awareness gap",
    "Blood storage unit non-functional",
    "Reporting gap",
  ],
  L3: [
    "Underutilized FRU capacity",
    "Specialist roster gaps (gynaec/paeds/anaes)",
    "Blood bank non-functional",
    "Equipment downtime (OT/USG)",
    "Long 108 ambulance turnaround",
    "Weak referral linkages from L1/L2",
    "Patient awareness gap",
    "Reporting gap",
  ],
};

function poolForLevel(level: Lvl) {
  const pool = SAMPLE_FACILITIES.filter((f) =>
    level === "L1"
      ? f.type.startsWith("PHC") || f.type.startsWith("SHC") || f.type.startsWith("SC")
      : level === "L2"
        ? f.type.startsWith("CHC")
        : f.type.startsWith("DH") || f.type.startsWith("CH"),
  );
  return pool.length ? pool : SAMPLE_FACILITIES;
}

// Builds a facility-level breakdown for a given tab/level/month, anchored to
// the level's overall rate for that month so the table stays consistent with
// the trend chart above it.
function buildRows(kind: Kind, level: Lvl, monthIdx: number): ReferralRow[] {
  const byLevel = kind === "in" ? REFERRAL_IN_BY_LEVEL : REFERRAL_OUT_BY_LEVEL;
  const monthRow = byLevel[monthIdx] ?? byLevel[byLevel.length - 1];
  const baseRate = monthRow[level];
  const reasons = kind === "in" ? REF_IN_REASONS[level] : REF_OUT_REASONS[level];
  const pool = poolForLevel(level);

  const rows = pool.slice(0, 12).map((f, i) => {
    // spread facilities around the level's average so the table tells a
    // believable story without claiming per-facility precision
    const offset = kind === "out" ? (12 - i) * 0.9 - 5 : (i - 6) * 0.5;
    const rate = Math.max(0.5, +(baseRate + offset).toFixed(1));
    return {
      facility: f.facility,
      district: f.district,
      type: f.type,
      rate,
      primaryReason: reasons[i % reasons.length],
      secondaryReason: reasons[(i + 3) % reasons.length],
    };
  });

  // referral-out: worst (highest) first · referral-in: worst (lowest) first
  return rows.sort((a, b) => (kind === "out" ? b.rate - a.rate : a.rate - b.rate));
}

export function ReferralTable({ kind, setKind }: { kind: Kind, setKind: any }) {
  // const [kind, setKind] = useState<Kind>("in");
  const [level, setLevel] = useState<Lvl>("L3");
  const months = useMemo(() => REFERRAL_IN_BY_LEVEL.map((d) => d.month), []);
  const [monthIdx, setMonthIdx] = useState(months.length - 1);

  const rows = useMemo(() => buildRows(kind, level, monthIdx), [kind, level, monthIdx]);
  const month = months[monthIdx];

  const columns: Array<{ key: keyof ReferralRow; label: string }> = [
    { key: "facility", label: "Facility" },
    { key: "district", label: "District" },
    { key: "type", label: "Type" },
    { key: "rate", label: kind === "in" ? "Referral-In %" : "Referral-Out %" },
    { key: "primaryReason", label: "Primary Likely Reason" },
    { key: "secondaryReason", label: "Secondary Reason" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        {/* <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <TabsList>
            <TabsTrigger value="in" className="gap-2">
              <Users2 className="h-4 w-4" /> Referral-In
            </TabsTrigger>
            <TabsTrigger value="out" className="gap-2">
              <Users2 className="h-4 w-4" /> Referral-Out
            </TabsTrigger>
          </TabsList>
        </Tabs> */}

        <div className="flex items-center justify-between px-4 pt-3 gap-8">
          <h4 className="text-xs font-semibold text-navy">
            {level} facilities — {kind === "in" ? "lowest referral-in" : "highest referral-out"} —{" "}
            {month}
          </h4>
          <span className="text-[11px] text-muted-foreground">{rows.length} facilities</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(monthIdx)} onValueChange={(v) => setMonthIdx(Number(v))}>
            <SelectTrigger className="h-9 w-[130px] text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={m} value={String(i)} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={(v) => setLevel(v as Lvl)}>
            <SelectTrigger className="h-9 w-[90px] text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L1" className="text-xs">
                L1
              </SelectItem>
              <SelectItem value="L2" className="text-xs">
                L2
              </SelectItem>
              <SelectItem value="L3" className="text-xs">
                L3
              </SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => downloadCSV(rows, `referral_${kind}_${level}_${month}`)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>



      <div className="max-h-[560px] overflow-auto p-4 pt-2">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-secondary text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="px-3 py-2 text-left">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.facility}
                className={`${i % 2 ? "bg-[#FAFBFC]" : "bg-white"} border-t border-border/60`}
              >
                <td className="px-3 py-2 text-foreground">{r.facility}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.district}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.type}</td>
                <td className="px-3 py-2 font-semibold text-navy">{r.rate}%</td>
                <td className="px-3 py-2 text-foreground">{r.primaryReason}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.secondaryReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
