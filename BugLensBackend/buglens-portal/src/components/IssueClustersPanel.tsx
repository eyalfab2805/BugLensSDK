import { reportTypeLabels } from "../constants/reports";
import type { IssueGroupSummary } from "../types/reports";
import { formatDate } from "../utils/reportAnalytics";

type IssueClustersPanelProps = {
  clusters: IssueGroupSummary[];
  onOpenCluster: (representativeReportId: string) => void;
};

export function IssueClustersPanel({
  clusters,
  onOpenCluster,
}: IssueClustersPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="section-label">Issue clusters</span>
          <h2>Recurring problems grouped together</h2>
        </div>
      </div>

      {clusters.length === 0 ? (
        <p className="empty-state">No repeating clusters in the current slice.</p>
      ) : (
        <div className="cluster-list">
          {clusters.map((cluster) => (
            <button
              key={cluster.fingerprint}
              className="cluster-item"
              onClick={() => onOpenCluster(cluster.representative_report_id)}
            >
              <div className="cluster-title-row">
                <strong>{cluster.title}</strong>
                <span className={`severity-pill ${cluster.severity.toLowerCase()}`}>
                  {cluster.severity}
                </span>
              </div>
              <p>
                {cluster.total_reports} reports / {cluster.affected_users} affected users /{" "}
                {reportTypeLabels[cluster.report_type]}
              </p>
              <span>
                Versions {cluster.app_versions.join(", ")} / latest seen{" "}
                {formatDate(cluster.latest_seen)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
