import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  chartColors,
  reportTypeLabels,
  statusLabels,
  statuses,
} from "../constants/reports";
import type {
  BugReport,
  ChartClickData,
  CountItem,
  ReportSeverity,
  ReportType,
  TimeItem,
} from "../types/reports";
import type { DashboardMetrics } from "../utils/reportAnalytics";
import { getMetadataValue } from "../utils/reportAnalytics";
import { ChartCard } from "./ChartCard";

type AnalyticsSectionProps = {
  metrics: DashboardMetrics;
  onOpenRelevantReport: (matcher: (report: BugReport) => boolean) => void;
};

export function AnalyticsSection({
  metrics,
  onOpenRelevantReport,
}: AnalyticsSectionProps) {
  return (
    <section className="analytics-grid">
      <PieAnalyticsCard
        title="Bug vs crash distribution"
        legend={metrics.reportTypeChartData}
        onLegendClick={(name) => {
          const type: ReportType = name === reportTypeLabels.crash ? "crash" : "bug";
          onOpenRelevantReport((report) => report.report_type === type);
        }}
        onSliceClick={(name) => {
          const type: ReportType = name === reportTypeLabels.crash ? "crash" : "bug";
          onOpenRelevantReport((report) => report.report_type === type);
        }}
      />

      <PieAnalyticsCard
        title="Lifecycle breakdown"
        legend={metrics.statusChartData}
        onLegendClick={(name) => {
          const status = statuses.find((item) => statusLabels[item] === name);
          if (status) {
            onOpenRelevantReport((report) => report.status === status);
          }
        }}
        onSliceClick={(name) => {
          const status = statuses.find((item) => statusLabels[item] === name);
          if (status) {
            onOpenRelevantReport((report) => report.status === status);
          }
        }}
      />

      <PieAnalyticsCard
        title="Severity distribution"
        legend={metrics.severityChartData}
        onLegendClick={(name) =>
          onOpenRelevantReport((report) => report.severity === name as ReportSeverity)
        }
        onSliceClick={(name) =>
          onOpenRelevantReport((report) => report.severity === name as ReportSeverity)
        }
      />

      <BarAnalyticsCard
        title="Reports by screen"
        legend={metrics.screenChartData}
        onLegendClick={(name) =>
          onOpenRelevantReport((report) => getMetadataValue(report, "screen") === name)
        }
        onBarClick={(name) =>
          onOpenRelevantReport((report) => getMetadataValue(report, "screen") === name)
        }
      />

      <BarAnalyticsCard
        title="Reports by feature"
        legend={metrics.featureChartData}
        onLegendClick={(name) =>
          onOpenRelevantReport((report) => getMetadataValue(report, "feature") === name)
        }
        onBarClick={(name) =>
          onOpenRelevantReport((report) => getMetadataValue(report, "feature") === name)
        }
      />

      <BarAnalyticsCard
        title="Android version impact"
        legend={metrics.androidChartData}
        xAxisVisible
        onLegendClick={(name) =>
          onOpenRelevantReport((report) => (report.android_version || "Unknown") === name)
        }
        onBarClick={(name) =>
          onOpenRelevantReport((report) => (report.android_version || "Unknown") === name)
        }
      />

      <BarAnalyticsCard
        title="Device concentration"
        legend={metrics.deviceChartData}
        onLegendClick={(name) =>
          onOpenRelevantReport((report) => (report.device_model || "Unknown") === name)
        }
        onBarClick={(name) =>
          onOpenRelevantReport((report) => (report.device_model || "Unknown") === name)
        }
      />

      <LineAnalyticsCard
        title="Report volume over time"
        data={metrics.reportsOverTime}
        legend={metrics.reportsOverTime.map((item) => ({
          name: item.date,
          value: item.reports,
        }))}
        onLegendClick={(name) =>
          onOpenRelevantReport((report) =>
            report.created_at
              ? new Date(report.created_at).toLocaleDateString() === name
              : name === "Unknown"
          )
        }
        onPointClick={(date) =>
          onOpenRelevantReport((report) =>
            report.created_at
              ? new Date(report.created_at).toLocaleDateString() === date
              : date === "Unknown"
          )
        }
      />

      <BarAnalyticsCard
        title="App version impact"
        legend={metrics.appVersionChartData}
        xAxisVisible
        onLegendClick={(name) =>
          onOpenRelevantReport((report) => (report.app_version || "Unknown") === name)
        }
        onBarClick={(name) =>
          onOpenRelevantReport((report) => (report.app_version || "Unknown") === name)
        }
      />
    </section>
  );
}

type PieAnalyticsCardProps = {
  title: string;
  legend: CountItem[];
  onLegendClick: (name: string) => void;
  onSliceClick: (name: string) => void;
};

function PieAnalyticsCard({
  title,
  legend,
  onLegendClick,
  onSliceClick,
}: PieAnalyticsCardProps) {
  return (
    <ChartCard title={title} legend={legend} onLegendClick={onLegendClick}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={legend}
            dataKey="value"
            nameKey="name"
            outerRadius={92}
            cursor="pointer"
            onClick={(data: ChartClickData) => {
              if (data?.name) {
                onSliceClick(data.name);
              }
            }}
          >
            {legend.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

type BarAnalyticsCardProps = {
  title: string;
  legend: CountItem[];
  onLegendClick: (name: string) => void;
  onBarClick: (name: string) => void;
  xAxisVisible?: boolean;
};

function BarAnalyticsCard({
  title,
  legend,
  onLegendClick,
  onBarClick,
  xAxisVisible = false,
}: BarAnalyticsCardProps) {
  return (
    <ChartCard title={title} legend={legend} onLegendClick={onLegendClick}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={legend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" hide={!xAxisVisible} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="value"
            cursor="pointer"
            onClick={(data: ChartClickData) => {
              const name = data?.name || data?.payload?.name;
              if (name) {
                onBarClick(name);
              }
            }}
          >
            {legend.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

type LineAnalyticsCardProps = {
  title: string;
  data: TimeItem[];
  legend: CountItem[];
  onLegendClick: (name: string) => void;
  onPointClick: (date: string) => void;
};

function LineAnalyticsCard({
  title,
  data,
  legend,
  onLegendClick,
  onPointClick,
}: LineAnalyticsCardProps) {
  return (
    <ChartCard title={title} legend={legend} onLegendClick={onLegendClick}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          onClick={(state: { activeLabel?: string | number }) => {
            if (typeof state?.activeLabel === "string") {
              onPointClick(state.activeLabel);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="reports"
            stroke="#60a5fa"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 7, cursor: "pointer" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
