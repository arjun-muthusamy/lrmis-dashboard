import { Download, X } from "lucide-react";
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
}

export function FacilityListPanel({ open, onClose, title, rows, columns, filename = "facilities" }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 max-h-[55vh] animate-in slide-in-from-bottom rounded-t-2xl border-t border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h4 className="text-sm font-semibold text-navy">{title}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(rows, filename)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Download className="h-3 w-3" /> Download CSV
          </button>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-[45vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-[#FAFBFC]" : "bg-white"}>
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-2.5 text-[13px] text-foreground">
                    {String(r[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
