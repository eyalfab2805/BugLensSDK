import { reportTypeLabels } from "../constants/reports";
import type { BugReport } from "../types/reports";
import { formatDate, getMetadataValue } from "../utils/reportAnalytics";

type ResolvedListPanelProps = {
  reports: BugReport[];
  selectedReport: BugReport | null;
  onSelectReport: (report: BugReport) => void;
};

export function ResolvedListPanel({
  reports,
  selectedReport,
  onSelectReport,
}: ResolvedListPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="section-label">Resolved archive</span>
          <h2>Completed bugs</h2>
        </div>

        <div className="filter-summary compact">
          <strong>{reports.length}</strong>
          <span>completed items</span>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="empty-state">
          Nothing has been resolved yet. Finished bugs will appear here.
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
                <span className={`status-pill ${report.status}`}>
                  {report.status.replace("_", " ")}
                </span>
              </div>
              <p>
                {reportTypeLabels[report.report_type]} / {report.app_version || "Unknown"} /{" "}
                {report.device_model || "Unknown"}
              </p>
              <span>
                {getMetadataValue(report, "feature")} on {getMetadataValue(report, "screen")}
              </span>
              <span>Last reported {formatDate(report.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
