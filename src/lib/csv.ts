export function downloadCSV(rows: ReadonlyArray<Record<string, unknown>> | ReadonlyArray<object>, filename: string): void {
  const arr = rows as ReadonlyArray<Record<string, unknown>>;
  if (!arr.length) return;
  const headers = Object.keys(arr[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...arr.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Score → blue gradient hex (0..100). */
export function scoreColor(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  const stops: Array<[number, [number, number, number]]> = [
    [0, [232, 244, 250]], // #E8F4FA
    [25, [168, 212, 234]], // #A8D4EA
    [50, [91, 174, 212]], // #5BAED4
    [75, [30, 111, 168]], // #1E6FA8
    [100, [15, 45, 86]], // #0F2D56
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (s >= stops[i][0] && s <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const t = (s - lo[0]) / Math.max(1, hi[0] - lo[0]);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  const [r, g, b] = [mix(lo[1][0], hi[1][0]), mix(lo[1][1], hi[1][1]), mix(lo[1][2], hi[1][2])];
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Traffic-light color for a 0..100 score: red < 50, amber 50-74, green ≥ 75. */
export function trafficColor(score: number): string {
  if (score < 50) return "#EF4444"; // red-500
  if (score < 75) return "#F59E0B"; // amber-500
  return "#10B981"; // emerald-500
}

/** Traffic-light bucket label. */
export function trafficBucket(score: number): "red" | "amber" | "green" {
  if (score < 50) return "red";
  if (score < 75) return "amber";
  return "green";
}
