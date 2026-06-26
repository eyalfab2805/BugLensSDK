import { reportTypeLabels } from "../constants/reports";
import type { BugReport } from "../types/reports";
import { formatDate, getMetadataValue } from "../utils/reportAnalytics";

type TodoListPanelProps = {
  reports: BugReport[];
  selectedReport: BugReport | null;
  onSelectReport: (report: BugReport) => void;
};

export function TodoListPanel({
  reports,
  selectedReport,
  onSelectReport,
}: TodoListPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="section-label">Developer todo</span>
          <h2>Current in-progress bugs</h2>
        </div>

        <div className="filter-summary compact">
          <strong>{reports.length}</strong>
          <span>active tasks</span>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="empty-state">
          Nothing is in progress yet. Open a bug in triage and use Start Working.
        </p>
      ) : (
        <div className="todo-list">
          {reports.map((report) => (
            <button
              key={report.report_id}
              className={`todo-item ${
                selectedReport?.report_id === report.report_id ? "active" : ""
              }`}
              onClick={() => onSelectReport(report)}
            >
              <div className="todo-item-header">
                <strong>{report.title}</strong>
                <span className={`severity-pill ${report.severity.toLowerCase()}`}>
                  {report.severity}
                </span>
              </div>
              <p>
                {reportTypeLabels[report.report_type]} / {report.app_version || "Unknown"} /{" "}
                {report.device_model || "Unknown"}
              </p>
              <span>
                {getMetadataValue(report, "feature")} on {getMetadataValue(report, "screen")}
              </span>
              <span>Started from report date {formatDate(report.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
