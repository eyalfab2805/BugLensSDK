import type { ReactNode } from "react";

import { chartColors } from "../constants/reports";
import type { CountItem } from "../types/reports";

type ChartCardProps = {
  title: string;
  children: ReactNode;
  legend?: CountItem[];
  onLegendClick?: (name: string) => void;
};

export function ChartCard({ title, children, legend, onLegendClick }: ChartCardProps) {
  return (
    <div className="panel chart-card">
      <span className="section-label">Analytics</span>
      <h2>{title}</h2>

      {children}

      {legend && legend.length > 0 ? (
        <div className="chart-legend">
          {legend.map((item, index) => (
            <button
              key={item.name}
              className="legend-item"
              onClick={() => onLegendClick?.(item.name)}
            >
              <span
                className="legend-dot"
                style={{ background: chartColors[index % chartColors.length] }}
              />
              <span className="legend-name">{item.name}</span>
              <strong>{item.value}</strong>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
