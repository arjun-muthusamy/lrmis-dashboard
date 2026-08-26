import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, FileText, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { DISTRICT_ROWS, OVERVIEW_STATS } from "@/lib/mock-data";
import { facilitiesForDistrict } from "@/lib/facility-mock";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — LRMIS" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const scope = user?.level === "state" ? "Madhya Pradesh State" :
                user?.level === "district" ? `${user.district} District` :
                `${user?.block} Block, ${user?.district}`;

  const generatePDF = () => {
    setBusy(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(15, 45, 86);
      doc.rect(0, 0, pageWidth, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("LRMIS Performance Report", 40, 38);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`${scope} • Period: May 2026`, 40, 58);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 40, 72);

      doc.setTextColor(0, 0, 0);

      // Summary stats
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Snapshot", 40, 110);

      autoTable(doc, {
        startY: 120,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [11, 123, 138], textColor: 255 },
        head: [["Metric", "Value"]],
        body: [
          ["Districts", String(OVERVIEW_STATS.districts)],
          ["Delivery Points", OVERVIEW_STATS.deliveryPoints.toLocaleString()],
          ["L1 / L2 / L3 Facilities", `${OVERVIEW_STATS.levels.L1} / ${OVERVIEW_STATS.levels.L2} / ${OVERVIEW_STATS.levels.L3}`],
          ["Labour Rooms / MOT / HDU", `${OVERVIEW_STATS.rooms.LR} / ${OVERVIEW_STATS.rooms.MOT} / ${OVERVIEW_STATS.rooms.HDU}`],
          ["Functional FRUs", `${OVERVIEW_STATS.frus} (73%)`],
          ["Total Deliveries (May 2026)", OVERVIEW_STATS.totalDeliveries.toLocaleString()],
        ],
      });

      // Top 5 / Bottom 5
      const t5 = DISTRICT_ROWS.slice(0, 5);
      const b5 = DISTRICT_ROWS.slice(-5);

      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [212, 162, 76], textColor: 255 },
        head: [["Rank", "District", "Division", "Composite", "HR", "Infra", "Drugs", "Outcomes"]],
        body: t5.map((r) => [r.rank, r.district, r.division, r.composite, r.hr, r.infra, r.drugs, r.outcomes]),
        didDrawPage: () => {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(212, 162, 76);
          doc.text("Top 5 Districts", 40, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10 : 240);
        },
      });

      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [225, 29, 72], textColor: 255 },
        head: [["Rank", "District", "Division", "Composite", "HR", "Infra", "Drugs", "Outcomes"]],
        body: b5.map((r) => [r.rank, r.district, r.division, r.composite, r.hr, r.infra, r.drugs, r.outcomes]),
      });

      // District-specific facility list (when district scope)
      if (user?.level !== "state" && user?.district) {
        const row = DISTRICT_ROWS.find((d) => d.district === user.district);
        if (row) {
          doc.addPage();
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 45, 86);
          doc.text(`Facility-Level Performance — ${user.district}`, 40, 50);
          const facs = facilitiesForDistrict(user.district, row.composite);
          autoTable(doc, {
            startY: 70,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 5 },
            headStyles: { fillColor: [15, 45, 86], textColor: 255 },
            head: [["Facility", "Type", "Score", "HR", "Infra", "Drugs", "Outcomes", "Deliveries"]],
            body: facs.map((f) => [f.facility, f.type, f.score, f.hr, f.infra, f.drugs, f.outcomes, f.deliveries]),
          });
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`LRMIS • NHM Madhya Pradesh • Page ${i} of ${pageCount}`, 40, doc.internal.pageSize.getHeight() - 20);
      }

      doc.save(`LRMIS_Report_${(user?.district ?? "MP")}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Download a static performance snapshot scoped to your access level.</p>
      </div>

      <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-teal-soft text-teal">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-navy">Monthly Performance Report</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              State / district / block snapshot covering domain scores, top &amp; bottom districts, and
              {user?.level !== "state" ? " facility-level performance" : " composite rankings"} for May 2026.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Scope: <strong className="text-foreground">{scope}</strong></span>
            </div>
            <Button onClick={generatePDF} disabled={busy} className="mt-4 gap-2">
              <FileDown className="h-4 w-4" />
              {busy ? "Generating…" : "Download PDF Report"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl rounded-xl border border-dashed border-border bg-secondary/30 p-5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Coming soon</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>HR cadre-wise vacancy report</li>
          <li>Stockout exception report</li>
          <li>Obs HDU monthly admission summary</li>
          <li>Quarterly trend &amp; comparison reports</li>
        </ul>
      </div>
    </div>
  );
}
