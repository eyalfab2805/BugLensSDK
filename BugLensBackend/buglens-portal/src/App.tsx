import { useEffect, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
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
import "./App.css";

type ReportStatus = "open" | "in_progress" | "resolved" | "closed";
type ReportSeverity = "Low" | "Medium" | "High" | "Critical";
type ReportType = "bug" | "crash";

type BugReport = {
  report_id: string;
  api_key: string;
  user_id: string | null;
  title: string;
  description: string;
  severity: ReportSeverity;
  report_type: ReportType;
  stack_trace: string | null;
  device_model: string | null;
  manufacturer: string | null;
  android_version: string | null;
  app_version: string | null;
  screenshot_path: string | null;
  metadata?: Record<string, string> | null;
  status: ReportStatus;
  created_at: string | null;
};

type CountItem = {
  name: string;
  value: number;
};

type TimeItem = {
  date: string;
  reports: number;
};

type ChartClickData = {
  name?: string;
  payload?: {
    name?: string;
    date?: string;
  };
};

const API_BASE_URL = "http://127.0.0.1:8000";

const statuses: ReportStatus[] = ["open", "in_progress", "resolved", "closed"];
const severities: ReportSeverity[] = ["Low", "Medium", "High", "Critical"];
const reportTypes: ReportType[] = ["bug", "crash"];

const statusLabels: Record<ReportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const reportTypeLabels: Record<ReportType, string> = {
  bug: "🐞 Bug",
  crash: "💥 Crash",
};

const chartColors = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
  "#c084fc",
];

function App() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        statusFilter === "all"
          ? `${API_BASE_URL}/reports`
          : `${API_BASE_URL}/reports/status/${statusFilter}`;

      const response = await axios.get<BugReport[]>(endpoint);

      const sortedReports = [...response.data].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );

      setReports(sortedReports);

      if (sortedReports.length > 0) {
        const stillExists = sortedReports.find(
          (report) => report.report_id === selectedReport?.report_id
        );

        setSelectedReport(stillExists || sortedReports[0]);
      } else {
        setSelectedReport(null);
      }
    } catch {
      setError("Could not load reports. Make sure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  function openRelevantReport(matcher: (report: BugReport) => boolean) {
    const match = reports.find(matcher);

    if (!match) return;

    setSelectedReport(match);

    window.setTimeout(() => {
      document.querySelector(".details-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function updateStatus(reportId: string, newStatus: ReportStatus) {
    const response = await axios.patch<BugReport>(
      `${API_BASE_URL}/reports/${reportId}/status`,
      { status: newStatus }
    );

    const updatedReport = response.data;

    setReports((previousReports) =>
      previousReports.map((report) =>
        report.report_id === reportId ? updatedReport : report
      )
    );

    setSelectedReport(updatedReport);
  }

  function getScreenshotUrl(path: string) {
    return path.replace("10.0.2.2", "127.0.0.1");
  }

  const totalReports = reports.length;

  const totalCrashes = reports.filter(
    (report) => report.report_type === "crash"
  ).length;

  const criticalReports = reports.filter(
    (report) => report.severity === "Critical"
  ).length;

  const openReports = reports.filter((report) => report.status === "open").length;

  const inProgressReports = reports.filter(
    (report) => report.status === "in_progress"
  ).length;

  const resolvedReports = reports.filter(
    (report) => report.status === "resolved"
  ).length;

  const unresolvedReports = openReports + inProgressReports;

  const affectedUsers = new Set(
    reports.map((report) => report.user_id || "Anonymous")
  ).size;

  const resolutionRate =
    totalReports === 0 ? 0 : Math.round((resolvedReports / totalReports) * 100);

  const mostAffectedDevice = useMemo(
    () => getTopValue(reports, (report) => report.device_model || "Unknown"),
    [reports]
  );

  const mostAffectedAndroid = useMemo(
    () => getTopValue(reports, (report) => report.android_version || "Unknown"),
    [reports]
  );

  const mostAffectedAppVersion = useMemo(
    () => getTopValue(reports, (report) => report.app_version || "Unknown"),
    [reports]
  );

  const mostAffectedManufacturer = useMemo(
    () => getTopValue(reports, (report) => report.manufacturer || "Unknown"),
    [reports]
  );

  const topUser = useMemo(
    () => getTopValue(reports, (report) => report.user_id || "Anonymous"),
    [reports]
  );

  const topScreen = useMemo(
    () => getTopValue(reports, (report) => getMetadataValue(report, "screen")),
    [reports]
  );

  const topFeature = useMemo(
    () => getTopValue(reports, (report) => getMetadataValue(report, "feature")),
    [reports]
  );

  const statusChartData: CountItem[] = statuses.map((status) => ({
    name: statusLabels[status],
    value: reports.filter((report) => report.status === status).length,
  }));

  const severityChartData: CountItem[] = severities.map((severity) => ({
    name: severity,
    value: reports.filter((report) => report.severity === severity).length,
  }));

  const reportTypeChartData: CountItem[] = reportTypes.map((type) => ({
    name: reportTypeLabels[type],
    value: reports.filter((report) => report.report_type === type).length,
  }));

  const androidChartData = useMemo(
    () => toCountItems(reports, (report) => report.android_version || "Unknown"),
    [reports]
  );

  const deviceChartData = useMemo(
    () =>
      toCountItems(reports, (report) => report.device_model || "Unknown").slice(
        0,
        6
      ),
    [reports]
  );

  const appVersionChartData = useMemo(
    () => toCountItems(reports, (report) => report.app_version || "Unknown"),
    [reports]
  );

  const screenChartData = useMemo(
    () =>
      toCountItems(reports, (report) =>
        getMetadataValue(report, "screen")
      ).slice(0, 8),
    [reports]
  );

  const featureChartData = useMemo(
    () =>
      toCountItems(reports, (report) =>
        getMetadataValue(report, "feature")
      ).slice(0, 8),
    [reports]
  );

  const reportsOverTime: TimeItem[] = useMemo(() => {
    const counts: Record<string, number> = {};

    reports.forEach((report) => {
      const date = report.created_at
        ? new Date(report.created_at).toLocaleDateString()
        : "Unknown";

      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.entries(counts).map(([date, count]) => ({
      date,
      reports: count,
    }));
  }, [reports]);

  const oldestOpenReport = useMemo(() => {
    return reports
      .filter((report) => report.status === "open" && report.created_at)
      .sort(
        (a, b) =>
          new Date(a.created_at || "").getTime() -
          new Date(b.created_at || "").getTime()
      )[0];
  }, [reports]);

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">BugLens SDK / Developer Portal</p>
          <h1>Production-grade Android issue intelligence.</h1>
          <p className="subtitle">
            Centralized crash-style bug reporting for Android teams: collect reports,
            inspect device context, prioritize open issues, and manage the complete
            triage lifecycle from one command center.
          </p>
        </div>

        <button className="refresh-button" onClick={fetchReports}>
          Refresh reports
        </button>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="kpi-grid">
        <MetricCard label="Total reports" value={totalReports.toString()} />
        <MetricCard
          label="Total crashes"
          value={totalCrashes.toString()}
          tone="danger"
        />
        <MetricCard
          label="Critical bugs"
          value={criticalReports.toString()}
          tone="danger"
        />
        <MetricCard
          label="Needs attention"
          value={openReports.toString()}
          tone="danger"
        />
        <MetricCard
          label="In investigation"
          value={inProgressReports.toString()}
          tone="warning"
        />
        <MetricCard
          label="Resolution rate"
          value={`${resolutionRate}%`}
          tone="success"
        />
        <MetricCard label="Affected users" value={affectedUsers.toString()} />
        <MetricCard label="Top screen" value={topScreen} />
        <MetricCard label="Top feature" value={topFeature} />
        <MetricCard label="Top device" value={mostAffectedDevice} />
        <MetricCard label="Top Android" value={mostAffectedAndroid} />
        <MetricCard label="Top app version" value={mostAffectedAppVersion} />
      </section>

      <section className="insight-panel">
        <div>
          <span className="section-label">Operational summary</span>
          <h2>
            {totalCrashes > 0
              ? `${totalCrashes} crash reports captured automatically`
              : criticalReports > 0
              ? `${criticalReports} critical bugs require immediate attention`
              : unresolvedReports > 0
              ? `${unresolvedReports} reports still require engineering attention`
              : "All reports are currently handled"}
          </h2>
          <p>
            {oldestOpenReport
              ? `Oldest open report is "${oldestOpenReport.title}", reported by ${
                  oldestOpenReport.user_id || "Anonymous"
                } on ${formatDate(oldestOpenReport.created_at)} from ${
                  oldestOpenReport.device_model || "Unknown device"
                }.`
              : "No open reports are waiting for initial triage."}
          </p>
        </div>

        <div>
          <span className="section-label">Metadata intelligence</span>
          <h2>{topFeature}</h2>
          <p>
            Most reported feature. The most affected screen is{" "}
            <strong>{topScreen}</strong>, the top reporting user is{" "}
            <strong>{topUser}</strong>, and the most impacted manufacturer is{" "}
            <strong>{mostAffectedManufacturer}</strong>.
          </p>
        </div>
      </section>

      <section className="analytics-grid">
        <ChartCard
          title="Bug vs crash distribution"
          legend={reportTypeChartData}
          onLegendClick={(name) => {
            const type = name.includes("Crash") ? "crash" : "bug";
            openRelevantReport((report) => report.report_type === type);
          }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={reportTypeChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={92}
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name;
                  if (!name) return;

                  const type = name.includes("Crash") ? "crash" : "bug";
                  openRelevantReport((report) => report.report_type === type);
                }}
              >
                {reportTypeChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Lifecycle breakdown"
          legend={statusChartData}
          onLegendClick={(name) => {
            const status = statuses.find((item) => statusLabels[item] === name);
            if (!status) return;
            openRelevantReport((report) => report.status === status);
          }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={92}
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name;
                  const status = statuses.find(
                    (item) => statusLabels[item] === name
                  );

                  if (!status) return;

                  openRelevantReport((report) => report.status === status);
                }}
              >
                {statusChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Severity distribution"
          legend={severityChartData}
          onLegendClick={(name) =>
            openRelevantReport((report) => report.severity === name)
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={severityChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={92}
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name;
                  if (!name) return;

                  openRelevantReport((report) => report.severity === name);
                }}
              >
                {severityChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Reports by screen"
          legend={screenChartData}
          onLegendClick={(name) =>
            openRelevantReport(
              (report) => getMetadataValue(report, "screen") === name
            )
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={screenChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name || data?.payload?.name;
                  if (!name) return;

                  openRelevantReport(
                    (report) => getMetadataValue(report, "screen") === name
                  );
                }}
              >
                {screenChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Reports by feature"
          legend={featureChartData}
          onLegendClick={(name) =>
            openRelevantReport(
              (report) => getMetadataValue(report, "feature") === name
            )
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={featureChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name || data?.payload?.name;
                  if (!name) return;

                  openRelevantReport(
                    (report) => getMetadataValue(report, "feature") === name
                  );
                }}
              >
                {featureChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Android version impact"
          legend={androidChartData}
          onLegendClick={(name) =>
            openRelevantReport(
              (report) => (report.android_version || "Unknown") === name
            )
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={androidChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name || data?.payload?.name;
                  if (!name) return;

                  openRelevantReport(
                    (report) => (report.android_version || "Unknown") === name
                  );
                }}
              >
                {androidChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Device concentration"
          legend={deviceChartData}
          onLegendClick={(name) =>
            openRelevantReport(
              (report) => (report.device_model || "Unknown") === name
            )
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deviceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name || data?.payload?.name;
                  if (!name) return;

                  openRelevantReport(
                    (report) => (report.device_model || "Unknown") === name
                  );
                }}
              >
                {deviceChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Report volume over time"
          legend={reportsOverTime.map((item) => ({
            name: item.date,
            value: item.reports,
          }))}
          onLegendClick={(name) =>
            openRelevantReport((report) =>
              report.created_at
                ? new Date(report.created_at).toLocaleDateString() === name
                : name === "Unknown"
            )
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reportsOverTime}>
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
                activeDot={{
                  r: 7,
                  cursor: "pointer",
                  onClick: (_event: unknown, payload: { payload?: TimeItem }) => {
                    const date = payload?.payload?.date;

                    if (!date) return;

                    openRelevantReport((report) =>
                      report.created_at
                        ? new Date(report.created_at).toLocaleDateString() === date
                        : date === "Unknown"
                    );
                  },
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="App version impact"
          legend={appVersionChartData}
          onLegendClick={(name) =>
            openRelevantReport(
              (report) => (report.app_version || "Unknown") === name
            )
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={appVersionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                cursor="pointer"
                onClick={(data: ChartClickData) => {
                  const name = data?.name || data?.payload?.name;
                  if (!name) return;

                  openRelevantReport(
                    (report) => (report.app_version || "Unknown") === name
                  );
                }}
              >
                {appVersionChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="workspace-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Engineering triage</span>
              <h2>Incoming bug reports</h2>
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReportStatus | "all")
              }
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="empty-state">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="empty-state">No reports found.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Issue</th>
                    <th>Device</th>
                    <th>Android</th>
                    <th>App</th>
                    <th>User</th>
                    <th>Screen</th>
                    <th>Feature</th>
                    <th>Reported</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.report_id}
                      onClick={() => setSelectedReport(report)}
                      className={
                        selectedReport?.report_id === report.report_id
                          ? "selected-row"
                          : ""
                      }
                    >
                      <td>
                        <span className={`status-pill ${report.status}`}>
                          {statusLabels[report.status]}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`severity-pill ${report.severity.toLowerCase()}`}
                        >
                          {report.severity}
                        </span>
                      </td>

                      <td>
                        <span className={`type-pill ${report.report_type}`}>
                          {reportTypeLabels[report.report_type]}
                        </span>
                      </td>

                      <td className="title-cell">{report.title}</td>
                      <td>{report.device_model || "Unknown"}</td>
                      <td>{report.android_version || "Unknown"}</td>
                      <td>{report.app_version || "Unknown"}</td>
                      <td>{report.user_id || "Anonymous"}</td>
                      <td>{getMetadataValue(report, "screen")}</td>
                      <td>{getMetadataValue(report, "feature")}</td>
                      <td>{formatDate(report.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel details-panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Technical debug profile</span>
              <h2>Selected report</h2>
            </div>
          </div>

          {selectedReport === null ? (
            <p className="empty-state">Select a report to inspect its debug context.</p>
          ) : (
            <>
              <div className="details-title-row">
                <div>
                  <h3>{selectedReport.title}</h3>
                  <p className="report-id">{selectedReport.report_id}</p>
                </div>

                <select
                  value={selectedReport.status}
                  onChange={(event) =>
                    updateStatus(
                      selectedReport.report_id,
                      event.target.value as ReportStatus
                    )
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <p className="description">{selectedReport.description}</p>

              {selectedReport.screenshot_path && (
                <button
                  className="see-image-button"
                  onClick={() =>
                    setImagePreviewUrl(
                      getScreenshotUrl(selectedReport.screenshot_path!)
                    )
                  }
                >
                  See image
                </button>
              )}

              <div className="debug-grid">
                <Info label="Severity" value={selectedReport.severity} />
                <Info
                  label="Type"
                  value={reportTypeLabels[selectedReport.report_type]}
                />
                <Info label="User ID" value={selectedReport.user_id} />
                <Info label="Screen" value={getMetadataValue(selectedReport, "screen")} />
                <Info
                  label="Feature"
                  value={getMetadataValue(selectedReport, "feature")}
                />
                <Info label="Device Model" value={selectedReport.device_model} />
                <Info label="Manufacturer" value={selectedReport.manufacturer} />
                <Info label="Android Version" value={selectedReport.android_version} />
                <Info label="App Version" value={selectedReport.app_version} />
                <Info label="API Key" value={selectedReport.api_key} />
                <Info label="Created At" value={formatDate(selectedReport.created_at)} />
              </div>

              {selectedReport.report_type === "crash" &&
                selectedReport.stack_trace && (
                  <div className="metadata-panel">
                    <span className="section-label">Crash stack trace</span>
                    <pre
                      style={{
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        fontSize: "12px",
                        lineHeight: "1.6",
                      }}
                    >
                      {selectedReport.stack_trace}
                    </pre>
                  </div>
                )}

              {selectedReport.metadata &&
                Object.keys(selectedReport.metadata).length > 0 && (
                  <div className="metadata-panel">
                    <span className="section-label">Custom metadata</span>

                    {Object.entries(selectedReport.metadata).map(([key, value]) => (
                      <Info key={key} label={key} value={value} />
                    ))}
                  </div>
                )}
            </>
          )}
        </aside>
      </section>

      {imagePreviewUrl && (
        <div
          className="image-modal-backdrop"
          onClick={() => setImagePreviewUrl(null)}
        >
          <div className="image-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="image-modal-close"
              onClick={() => setImagePreviewUrl(null)}
            >
              ×
            </button>

            <img src={imagePreviewUrl} alt="Bug report screenshot" />
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "success";
}) {
  return (
    <div className={`metric-card ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type ChartCardProps = {
  title: string;
  children: ReactNode;
  legend?: CountItem[];
  onLegendClick?: (name: string) => void;
};

function ChartCard({ title, children, legend, onLegendClick }: ChartCardProps) {
  return (
    <div className="panel chart-card">
      <span className="section-label">Analytics</span>
      <h2>{title}</h2>

      {children}

      {legend && legend.length > 0 && (
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
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value || "N/A"}</strong>
    </div>
  );
}

function getMetadataValue(report: BugReport, key: string): string {
  return report.metadata?.[key]?.trim() || "Unknown";
}

function getTopValue(
  reports: BugReport[],
  selector: (report: BugReport) => string
): string {
  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    const value = selector(report);
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
}

function toCountItems(
  reports: BugReport[],
  selector: (report: BugReport) => string
): CountItem[] {
  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    const value = selector(report);
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
}

export default App;