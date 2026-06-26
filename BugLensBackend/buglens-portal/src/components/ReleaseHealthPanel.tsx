import type { BugReport, ReleaseHealthSummary } from "../types/reports";
import { formatDate } from "../utils/reportAnalytics";

type ReleaseHealthPanelProps = {
  releases: ReleaseHealthSummary[];
  onSelectVersion: (version: string) => void;
  onOpenReport: (report: BugReport) => void;
  reports: BugReport[];
};

export function ReleaseHealthPanel({
  releases,
  onSelectVersion,
  onOpenReport,
  reports,
}: ReleaseHealthPanelProps) {
  const latestRelease = releases[0];
  const latestReleaseLead = latestRelease
    ? reports.find((report) => (report.app_version || "Unknown") === latestRelease.version)
    : null;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="section-label">Release health</span>
          <h2>Version impact at a glance</h2>
        </div>
      </div>

      {latestRelease ? (
        <div className="release-hero">
          <div>
            <span className="section-label">Most recent version in traffic</span>
            <h3>{latestRelease.version}</h3>
            <p>
              {latestRelease.totalReports} reports, {latestRelease.crashReports} crashes,{" "}
              {latestRelease.openReports} unresolved, latest seen{" "}
              {formatDate(latestRelease.latestSeen)}.
            </p>
          </div>

          <div className="release-actions">
            <button
              className="secondary-button"
              onClick={() => onSelectVersion(latestRelease.version)}
            >
              Filter to this version
            </button>
            {latestReleaseLead ? (
              <button
                className="secondary-button"
                onClick={() => onOpenReport(latestReleaseLead)}
              >
                Open latest report
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="empty-state">No release data available.</p>
      )}

      <div className="release-list">
        {releases.map((release) => (
          <button
            key={release.version}
            className="release-item"
            onClick={() => onSelectVersion(release.version)}
          >
            <div>
              <strong>{release.version}</strong>
              <span>Latest seen {formatDate(release.latestSeen)}</span>
            </div>
            <div className="release-stats">
              <span>{release.totalReports} total</span>
              <span>{release.crashReports} crashes</span>
              <span>{release.openReports} unresolved</span>
              <span>{release.criticalReports} critical</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
