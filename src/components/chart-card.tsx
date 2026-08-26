import { Info, Download, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  info?: string;
  children: ReactNode;
  toggle?: { value: "%" | "#"; onChange: (v: "%" | "#") => void };
  onDownload?: () => void;
  breadcrumb?: { label: string; onBack: () => void };
  className?: string;
  headerRight?: ReactNode;
  onBodyClick?: () => void;
}

export function ChartCard({
  title,
  info,
  children,
  toggle,
  onDownload,
  breadcrumb,
  className,
  headerRight,
  onBodyClick,
}: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          {breadcrumb && (
            <button
              onClick={breadcrumb.onBack}
              className="mb-1 flex items-center gap-1 text-[11px] text-teal hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> {breadcrumb.label}
            </button>
          )}
          <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {toggle && (
            <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
              {(["%", "#"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => toggle.onChange(m)}
                  className={`px-2 py-0.5 font-semibold ${
                    toggle.value === m
                      ? "bg-navy text-navy-foreground"
                      : "bg-white text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Download CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          {headerRight}
        </div>
      </div>
      <div
        className={`p-4 ${onBodyClick ? "cursor-pointer hover:bg-secondary/30 transition-colors" : ""}`}
        onClick={onBodyClick}
      >
        {children}
      </div>
    </div>
  );
}
