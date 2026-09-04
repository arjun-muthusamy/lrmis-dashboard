"use client";

import { useMemo, useState } from "react";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { downloadCSV } from "@/lib/csv";

export interface FacilityRow {
  facility?: string;
  district?: string;
  block?: string;
  type?: string;
  [k: string]: string | number | undefined;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: FacilityRow[];
  columns: Array<{ key: keyof FacilityRow; label: string }>;
  filename?: string;
  pageSize?: number;
}

export function FacilityListPanel({
  open,
  onClose,
  title,
  rows,
  columns,
  filename = "facilities",
  pageSize = 10,
}: Props) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  if (!open) return null;

  const rangeStart = rows.length === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min(rows.length, (currentPage + 1) * pageSize);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 flex max-h-[85vh] w-full max-w-4xl flex-col animate-in zoom-in-95 fade-in rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h4 className="text-sm font-semibold text-navy">{title}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCSV(rows, filename)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Download className="h-3 w-3" /> Download CSV
            </button>
            <button
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-secondary">
              <tr>
                {columns.map((c) => (
                  <th
                    key={String(c.key)}
                    className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-[#FAFBFC]" : "bg-white"}>
                  {columns.map((c) => (
                    <td key={String(c.key)} className="px-4 py-2.5 text-[13px] text-foreground">
                      {String(r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-[13px] text-muted-foreground"
                  >
                    No records to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
            <span className="text-[12px] text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {rows.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[70px] text-center text-[12px] text-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
