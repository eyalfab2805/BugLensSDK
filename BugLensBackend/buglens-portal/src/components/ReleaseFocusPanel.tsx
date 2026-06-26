import type {
  BugReport,
  ReleaseDiagnostics,
  ReleaseHealthSummary,
} from "../types/reports";
import { formatDate, getMetadataValue } from "../utils/reportAnalytics";

type ReleaseFocusPanelProps = {
  release: ReleaseHealthSummary | null;
  diagnostics: ReleaseDiagnostics;
  reports: BugReport[];
  selectedReport: BugReport | null;
  onSelectReport: (report: BugReport) => void;
  onClearFocus: () => void;
};

export function ReleaseFocusPanel({
  release,
  diagnostics,
  reports,
  selectedReport,
  onSelectReport,
  onClearFocus,
}: ReleaseFocusPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="section-label">Release workspace</span>
          <h2>{release ? `Version ${release.version}` : "Select a version"}</h2>
        </div>

        {release ? (
          <button className="secondary-button" onClick={onClearFocus}>
            Show latest version
          </button>
        ) : null}
      </div>

      {release ? (
        <>
          <div className="release-focus-summary">
            <div className="release-focus-stat">
              <span>Total reports</span>
              <strong>{release.totalReports}</strong>
            </div>
            <div className="release-focus-stat">
              <span>Crashes</span>
              <strong>{release.crashReports}</strong>
            </div>
            <div className="release-focus-stat">
              <span>Unresolved</span>
              <strong>{release.openReports}</strong>
            </div>
            <div className="release-focus-stat">
              <span>Critical</span>
              <strong>{release.criticalReports}</strong>
            </div>
          </div>

          <div className="release-diagnostics-grid">
            <div className="release-diagnostic-card">
              <span className="section-label">Most affected feature</span>
              <h3>{diagnostics.topFeature}</h3>
              <p>Feature generating the highest report volume for this version.</p>
            </div>

            <div className="release-diagnostic-card">
              <span className="section-label">Most affected screen</span>
              <h3>{diagnostics.topScreen}</h3>
              <p>Screen where users are most frequently hitting issues.</p>
            </div>

            <div className="release-diagnostic-card">
              <span className="section-label">Top recurring issue</span>
              <h3>{diagnostics.topClusterTitle}</h3>
              <p>
                {diagnostics.topClusterCount} reports are grouped under the leading recurring
                problem in this release.
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <p className="empty-state">No reports were captured for this version.</p>
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
                    {report.severity} / {report.device_model || "Unknown device"} /{" "}
                    {report.android_version || "Unknown Android"}
                  </p>
                  <span>
                    {getMetadataValue(report, "feature")} on {getMetadataValue(report, "screen")}
                  </span>
                  <span>Reported {formatDate(report.created_at)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="empty-state">No release data available.</p>
      )}
    </section>
  );
}
