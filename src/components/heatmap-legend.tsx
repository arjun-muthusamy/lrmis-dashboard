import {
  HEATMAP_COLORS,
  HEATMAP_LAST_MONTH,
  heatmapScale,
  type HeatmapScale,
  type HeatmapMode,
} from "@/lib/heatmap-data";

type HeatmapPalette = {
  delivery: Record<"low" | "medium" | "high", string>;
  mortality: Record<"low" | "medium" | "high", string>;
};

interface Props {
  mode: HeatmapMode;
  deliveryScale?: HeatmapScale;
  mortalityScale?: HeatmapScale;
  scopeLabel?: string;
  palette?: HeatmapPalette;
}

function rangeLabels(mode: "delivery" | "mortality", scale: HeatmapScale): string[] {
  const format = (value: number) =>
    mode === "delivery" ? Math.round(value).toLocaleString() : Math.round(value).toString();
  return [
    `${format(scale.min)}–${format(scale.lowMax)}`,
    `${format(scale.lowMax)}–${format(scale.mediumMax)}`,
    `${format(scale.mediumMax)}–${format(scale.max)}`,
  ];
}

function Scale({
  mode,
  scale,
  palette,
}: {
  mode: "delivery" | "mortality";
  scale: HeatmapScale;
  palette: HeatmapPalette;
}) {
  const labels = rangeLabels(mode, scale);
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold text-foreground">
        {mode === "delivery" ? "Deliveries" : "Maternal + neonatal deaths"}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["low", "medium", "high"] as const).map((band, index) => (
          <span key={band} className="inline-flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-black/5"
              style={{ background: palette[mode][band] }}
            />
            <span className="capitalize">{band}</span>
            <span className="text-muted-foreground">({labels[index]})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeatmapLegend({
  mode,
  deliveryScale = heatmapScale("delivery"),
  mortalityScale = heatmapScale("mortality"),
  scopeLabel,
  palette = HEATMAP_COLORS,
}: Props) {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-[10px]">
      {(mode === "delivery" || mode === "combined") && (
        <Scale mode="delivery" scale={deliveryScale} palette={palette} />
      )}
      {(mode === "mortality" || mode === "combined") && (
        <Scale mode="mortality" scale={mortalityScale} palette={palette} />
      )}
      <span className="ml-auto text-muted-foreground">
        {scopeLabel ? `${scopeLabel} · ` : ""}Reporting month: {HEATMAP_LAST_MONTH}
      </span>
    </div>
  );
}
