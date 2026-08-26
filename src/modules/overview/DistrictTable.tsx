import { useState, useMemo } from "react";
import { Search, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DISTRICT_ROWS } from "@/lib/mock-data";
import { facilitiesForDistrict } from "@/lib/facility-mock";
import { levelFromType, type Level } from "@/lib/scoring-rubric";

const PAGE_SIZE = 10;

export function DistrictTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    return DISTRICT_ROWS.map((row) => {
      const facilities = facilitiesForDistrict(row.district, row.composite);
      const counts: Record<Level, number> = { L1: 0, L2: 0, L3: 0 };
      facilities.forEach((f) => {
        counts[levelFromType(f.type)]++;
      });
      return {
        district: row.district,
        division: row.division,
        L1: counts.L1,
        L2: counts.L2,
        L3: counts.L3,
        totalDeliveries: row.totalDeliveries,
        cSection: row.cSection,
        points: Math.round(row.functionalDPs / 4),
      };
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.district.toLowerCase().includes(q) || r.division.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">All Districts</h3>
          <p className="text-[11px] text-muted-foreground">
            {filtered.length} of {rows.length} districts
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search district or division..."
            className="h-9 w-64 rounded-md border border-border bg-white pl-8 pr-3 text-xs outline-none focus:border-teal"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">District</th>
              <th className="px-4 py-2.5 text-center">L1</th>
              <th className="px-4 py-2.5 text-center">L2</th>
              <th className="px-4 py-2.5 text-center">L3</th>
              <th className="px-4 py-2.5 text-right">Total Deliveries</th>
              <th className="px-4 py-2.5 text-right">C-Section</th>
              <th className="px-4 py-2.5 text-right">Points</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No districts match &quot;{search}&quot;
                </td>
              </tr>
            )}
            {paged.map((r, i) => (
              <tr
                key={r.district}
                className={`${i % 2 ? "bg-[#FAFBFC]" : "bg-white"} border-t border-border/60 hover:bg-teal-soft/30`}
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium text-foreground">{r.district}</div>
                  <div className="text-[10px] text-muted-foreground">{r.division} Division</div>
                </td>
                <td className="px-4 py-2.5 text-center text-foreground">{r.L1}</td>
                <td className="px-4 py-2.5 text-center text-foreground">{r.L2}</td>
                <td className="px-4 py-2.5 text-center text-foreground">{r.L3}</td>
                <td className="px-4 py-2.5 text-right text-foreground">
                  {r.totalDeliveries.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right text-foreground">{r.cSection}%</td>
                <td className="px-4 py-2.5 text-right text-foreground">{r.points}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    to="/district/$districtId"
                    params={{ districtId: r.district }}
                    className="inline-flex items-center gap-1 rounded-md border border-teal/30 bg-teal-soft/40 px-2.5 py-1 text-[11px] font-medium text-teal hover:bg-teal-soft"
                  >
                    <Eye className="h-3 w-3" /> View Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border p-3 text-[11px]">
          <span className="text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="rounded-md border border-border px-2.5 py-1 font-medium text-foreground hover:bg-secondary disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-muted-foreground">…</span>
                  )}
                  <button
                    onClick={() => goToPage(p)}
                    className={`rounded-md px-2.5 py-1 font-medium ${
                      p === safePage
                        ? "bg-navy text-navy-foreground"
                        : "border border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="rounded-md border border-border px-2.5 py-1 font-medium text-foreground hover:bg-secondary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
