"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { color } from "@/lib/tokens";

type Point = { label: string; value: number };

/**
 * The only way to render recharts here: animation off (default is ~1.5s
 * on mount, which breaks DESIGN_PLAN §8), token colors, sparse axis labels.
 */
export function LineChart({
  data,
  height = 160,
  format,
  label,
}: {
  data: Point[];
  height?: number;
  format: (n: number) => string;
  label: string;
}) {
  const ticks = data.length > 2 ? [data[0].label, data[Math.floor(data.length / 2)].label, data[data.length - 1].label] : data.map((d) => d.label);
  return (
    <figure aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={color.chartGrid} />
          <XAxis
            dataKey="label"
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tick={{ fill: color.chartAxis, fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: color.border }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-sm border border-border-default bg-surface-raised px-3 py-2 text-sm">
                  <div className="text-text-tertiary">{payload[0].payload.label}</div>
                  <div className="num font-medium">{format(payload[0].value as number)}</div>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color.chartLine}
            strokeWidth={1.5}
            fill={color.chartLine}
            fillOpacity={0.06}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
