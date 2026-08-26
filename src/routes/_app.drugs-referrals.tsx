import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Pill, Lock } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import { FacilityListPanel, type FacilityRow } from "@/components/facility-list-panel";
import { STOCKOUT_TREND, SAMPLE_FACILITIES } from "@/lib/mock-data";
import { STOCKOUT_ITEMS } from "@/lib/mock-extra";
import { downloadCSV } from "@/lib/csv";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DrugsStockoutTable } from "@/modules/drugs-stockout-table/drugs-stockout-table";
import { AnalyticCard } from "@/components/analytic-card";

export const Route = createFileRoute("/_app/drugs-referrals")({
  head: () => ({ meta: [{ title: "Drugs, Consumables & Equipment — LRMIS" }] }),
  component: DrugsPage,
});

const C = { rose: "#E11D48", amber: "#D97706", indigo: "#6366F1" };

const STOCKOUT_KIND_OPTIONS = [
  { value: "medicines", label: "Essential Medicines", color: C.rose },
  { value: "consumables", label: "Consumables", color: C.amber },
  { value: "equipment", label: "Equipment", color: C.indigo },
] as const;
type StockoutKind = (typeof STOCKOUT_KIND_OPTIONS)[number]["value"];

const FACILITY_TYPES = ["All", "DH", "CHC", "PHC", "SHC"] as const;
type FacilityType = (typeof FACILITY_TYPES)[number];

function DrugsPage() {
  const [stockoutKind, setStockoutKind] = useState<StockoutKind>("medicines");
  const [stockoutItem, setStockoutItem] = useState<string>("All");
  const [stockoutType, setStockoutType] = useState<FacilityType>("All");
  const [panel, setPanel] = useState<{
    title: string;
    rows: FacilityRow[];
    columns: Array<{ key: keyof FacilityRow; label: string }>;
  } | null>(null);

  const stockoutMeta = STOCKOUT_KIND_OPTIONS.find((k) => k.value === stockoutKind)!;
  const items = STOCKOUT_ITEMS[stockoutKind];

  const stockoutData = useMemo(() => {
    const typeMult =
      stockoutType === "All"
        ? 1
        : stockoutType === "DH"
          ? 0.55
          : stockoutType === "CHC"
            ? 0.85
            : stockoutType === "PHC"
              ? 1.15
              : 1.3;
    const itemMult = stockoutItem === "All" ? 1 : 0.45 + (stockoutItem.length % 5) * 0.12;
    return STOCKOUT_TREND.map((d) => ({
      month: d.month,
      value: +(d[stockoutKind] * typeMult * itemMult).toFixed(1),
    }));
  }, [stockoutKind, stockoutType, stockoutItem]);

  const facilityRowsWithStockout = SAMPLE_FACILITIES.filter(
    (f) => stockoutType === "All" || f.type === stockoutType,
  )
    .slice(0, 20)
    .map((f, i) => ({
      ...f,
      division: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"][i % 5],
      item: stockoutItem === "All" ? stockoutMeta.label : stockoutItem,
      daysSince: 14 + ((i * 7) % 90),
      lastReported: "27 May 2026",
    }));

  const openStockoutPanel = () =>
    setPanel({
      title: `Stockout — ${stockoutMeta.label}${stockoutItem !== "All" ? ` · ${stockoutItem}` : ""} (${stockoutType})`,
      rows: facilityRowsWithStockout,
      columns: [
        { key: "facility", label: "Facility" },
        { key: "district", label: "District" },
        { key: "division", label: "Division" },
        { key: "type", label: "Type" },
        { key: "item", label: "Item" },
        { key: "daysSince", label: "Stockout Since (days)" },
      ],
    });

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Drugs, Consumables & Equipment</h1>
        <p className="text-sm text-muted-foreground">
          Last completed month —{" "}
          <span className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy">
            <Lock className="h-3 w-3" /> May 2026
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AnalyticCard
          icon={Pill}
          value="38%"
          label="Full Kit Availability"
          indicator="fullKit"
          color="green"
        />
        <AnalyticCard
          icon={Pill}
          value="12%"
          label="Chronic Stockout Facilities (≥3 months)"
          indicator="stockout"
          color="red"
        />
        <AnalyticCard
          icon={Pill}
          value="22%"
          label="Non-Functioning Equipment Rate"
          indicator="equipmentNF"
          color="orange"
        />
      </div>

      <ChartCard
        title="Facilities Reporting Stockout — Monthly Trend"
        info="Share of facilities reporting at least one stockout. Use the dropdowns to filter by kind, specific item, and facility type. Click a point to open the facility line-list."
        onDownload={() =>
          downloadCSV(stockoutData, `stockout_${stockoutKind}_${stockoutItem}_${stockoutType}`)
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            value={stockoutKind}
            onValueChange={(v) => {
              setStockoutKind(v as StockoutKind);
              setStockoutItem("All");
            }}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCKOUT_KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockoutItem} onValueChange={setStockoutItem}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((it) => (
                <SelectItem key={it} value={it} className="text-xs">
                  {it === "All" ? "All Items" : it}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockoutType} onValueChange={(v) => setStockoutType(v as FacilityType)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FACILITY_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t === "All" ? "All Facility Types" : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={openStockoutPanel}
            className="ml-auto rounded-md border border-teal/40 bg-teal-soft/40 px-3 py-1 text-[11px] font-semibold text-teal hover:bg-teal-soft"
          >
            View facility list →
          </button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={stockoutData} onClick={openStockoutPanel}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v: number) => `${v}%`}
            />
            <ReferenceArea y1={15} y2={40} fill={C.rose} fillOpacity={0.05} />
            <Line
              type="monotone"
              dataKey="value"
              name={stockoutMeta.label}
              stroke={stockoutMeta.color}
              strokeWidth={2.5}
              dot={{ r: 3, cursor: "pointer" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <DrugsStockoutTable
        kind={stockoutKind}
        kindLabel={stockoutMeta.label}
        item={stockoutItem}
        facilityType={stockoutType}
      />

      {/* <FacilityListPanel
        open={!!panel}
        onClose={() => setPanel(null)}
        title={panel?.title ?? ""}
        rows={panel?.rows ?? []}
        columns={panel?.columns ?? []}
      /> */}
    </div>
  );
}
