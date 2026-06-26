import { reportTypeLabels, statusLabels, statuses } from "../constants/reports";
import type { BugReport, ReportStatus } from "../types/reports";
import { formatDate, getMetadataValue } from "../utils/reportAnalytics";

type ReportDetailsPanelProps = {
  selectedReport: BugReport | null;
  onPreviewImage: (url: string) => void;
  onUpdateStatus: (reportId: string, newStatus: ReportStatus) => Promise<void>;
};

export function ReportDetailsPanel({
  selectedReport,
  onPreviewImage,
  onUpdateStatus,
}: ReportDetailsPanelProps) {
  return (
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
                void onUpdateStatus(
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

          {selectedReport.screenshot_path ? (
            <button
              className="see-image-button"
              onClick={() => onPreviewImage(selectedReport.screenshot_path!)}
            >
              See screenshot
            </button>
          ) : null}

          <div className="debug-grid">
            <InfoRow label="Severity" value={selectedReport.severity} />
            <InfoRow
              label="Type"
              value={reportTypeLabels[selectedReport.report_type]}
            />
            <InfoRow label="User ID" value={selectedReport.user_id} />
            <InfoRow label="Screen" value={getMetadataValue(selectedReport, "screen")} />
            <InfoRow
              label="Feature"
              value={getMetadataValue(selectedReport, "feature")}
            />
            <InfoRow label="Device Model" value={selectedReport.device_model} />
            <InfoRow label="Manufacturer" value={selectedReport.manufacturer} />
            <InfoRow label="Android Version" value={selectedReport.android_version} />
            <InfoRow label="App Version" value={selectedReport.app_version} />
            <InfoRow label="API Key" value={selectedReport.api_key} />
            <InfoRow label="Created At" value={formatDate(selectedReport.created_at)} />
          </div>

          {selectedReport.report_type === "crash" && selectedReport.stack_trace ? (
            <div className="metadata-panel">
              <span className="section-label">Crash stack trace</span>
              <pre className="stack-trace">{selectedReport.stack_trace}</pre>
            </div>
          ) : null}

          {selectedReport.metadata && Object.keys(selectedReport.metadata).length > 0 ? (
            <div className="metadata-panel">
              <span className="section-label">Custom metadata</span>

              {Object.entries(selectedReport.metadata).map(([key, value]) => (
                <InfoRow key={key} label={key} value={value} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value || "N/A"}</strong>
    </div>
  );
}
