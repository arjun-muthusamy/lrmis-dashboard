import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { INDICATOR_DEFS, type IndicatorKey } from "@/lib/indicator-definitions";

interface Props {
  indicator?: IndicatorKey;
  text?: string;
  className?: string;
}

export function InfoTooltip({ indicator, text, className }: Props) {
  const def = indicator ? INDICATOR_DEFS[indicator] : null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`text-muted-foreground transition-colors hover:text-foreground ${className ?? ""}`}
            aria-label="Indicator definition"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-3" side="top">
          {def ? (
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-white">{def.name}</div>
              <div className="text-gray-300">{def.description}</div>
              {def.numerator && (
                <div><span className="font-semibold">Numerator:</span> {def.numerator}</div>
              )}
              {def.denominator && (
                <div><span className="font-semibold">Denominator:</span> {def.denominator}</div>
              )}
              {def.source && (
                <div className="pt-0.5 italic opacity-80">Source: {def.source}</div>
              )}
            </div>
          ) : (
            <p className="text-xs">{text}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
