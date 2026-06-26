import { reportTypeLabels, statusLabels, statuses } from "../constants/reports";
import type { BugReport, ReportStatus } from "../types/reports";
import { formatDate, getMetadataValue } from "../utils/reportAnalytics";

type ReportsTablePanelProps = {
  loading: boolean;
  reports: BugReport[];
  selectedReport: BugReport | null;
  statusFilter: ReportStatus | "all";
  onSelectReport: (report: BugReport) => void;
  onStatusFilterChange: (value: ReportStatus | "all") => void;
};

export function ReportsTablePanel({
  loading,
  reports,
  selectedReport,
  statusFilter,
  onSelectReport,
  onStatusFilterChange,
}: ReportsTablePanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="section-label">Engineering triage</span>
          <h2>Incoming bug reports</h2>
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as ReportStatus | "all")
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
                  onClick={() => onSelectReport(report)}
                  className={
                    selectedReport?.report_id === report.report_id ? "selected-row" : ""
                  }
                >
                  <td>
                    <span className={`status-pill ${report.status}`}>
                      {statusLabels[report.status]}
                    </span>
                  </td>

                  <td>
                    <span className={`severity-pill ${report.severity.toLowerCase()}`}>
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
  );
}
