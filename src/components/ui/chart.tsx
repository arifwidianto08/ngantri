"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
    unit?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ReactNode;
  }
>(({ className, children, config, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-surface]:overflow-visible [&_.recharts-default-tooltip]:!bg-background [&_.recharts-default-tooltip]:!border-border [&_.recharts-default-tooltip]:!shadow-md",
          className
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      name: string;
      value: number | string;
      color?: string;
    }>;
    label?: string | number;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    labelFormatter?: (value: unknown) => React.ReactNode;
    labelKey?: string;
  }
>(
  (
    {
      active,
      payload,
      label,
      hideLabel,
      hideIndicator,
      indicator = "dot",
      labelFormatter,
      labelKey,
      className,
      ...props
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.[0]) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = config[key as keyof typeof config];

      if (labelFormatter) {
        return (
          <span className="text-muted-foreground">{labelFormatter(label)}</span>
        );
      }

      if (!itemConfig?.label) {
        return null;
      }

      return <span className="text-muted-foreground">{itemConfig.label}</span>;
    }, [config, hideLabel, labelFormatter, label, labelKey, payload]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "line";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
        {...props}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${labelKey || item.dataKey || item.name || "value"}`;
            const itemConfig = config[key as keyof typeof config];

            const indicatorColor =
              itemConfig?.color || item.color || "var(--muted-foreground)";

            return (
              <div
                key={`${item.dataKey}-${index}`}
                className={cn(
                  "flex w-full flex-col gap-1.5",
                  nestLabel ? "items-baseline" : "items-start"
                )}
              >
                <span className="flex items-center gap-1.5 text-foreground">
                  {hideIndicator ? null : (
                    <span
                      className={cn(
                        "shrink-0 rounded-[2px] border-[--color-border]",
                        indicator === "dot"
                          ? "h-2 w-2 rounded-full"
                          : indicator === "dashed"
                          ? "w-0 border-l-2 border-dashed"
                          : "w-0 border-l-2"
                      )}
                      style={
                        {
                          "--color-bg": indicatorColor,
                          "--color-border": indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  {nestLabel ? itemConfig?.label || key : null}
                  <span className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {item.value}
                    {itemConfig?.unit && (
                      <span className="font-normal text-muted-foreground">
                        {itemConfig.unit}
                      </span>
                    )}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent };
