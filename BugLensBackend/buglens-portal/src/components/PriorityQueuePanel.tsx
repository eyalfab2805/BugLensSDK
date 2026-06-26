import { reportTypeLabels, statusLabels } from "../constants/reports";
import type { BugReport, PriorityBucket } from "../types/reports";
import { formatDate } from "../utils/reportAnalytics";

type PriorityQueuePanelProps = {
  buckets: PriorityBucket[];
  onSelectReport: (report: BugReport) => void;
};

export function PriorityQueuePanel({
  buckets,
  onSelectReport,
}: PriorityQueuePanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="section-label">Triage queue</span>
          <h2>What needs action first</h2>
        </div>
      </div>

      <div className="priority-grid">
        {buckets.map((bucket) => (
          <div key={bucket.label} className={`priority-card ${bucket.tone}`}>
            <div className="priority-card-header">
              <div>
                <h3>{bucket.label}</h3>
                <p>{bucket.helper}</p>
              </div>
              <strong>{bucket.reports.length}</strong>
            </div>

            {bucket.reports.length === 0 ? (
              <p className="empty-state">No reports in this bucket.</p>
            ) : (
              <div className="priority-list">
                {bucket.reports.map((report) => (
                  <button
                    key={report.report_id}
                    className="priority-item"
                    onClick={() => onSelectReport(report)}
                  >
                    <strong>{report.title}</strong>
                    <span>
                      {report.severity} {reportTypeLabels[report.report_type]} /{" "}
                      {statusLabels[report.status]}
                    </span>
                    <span>
                      {report.app_version || "Unknown"} / {formatDate(report.created_at)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
