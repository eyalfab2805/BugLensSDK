import type { DashboardMetrics } from "../utils/reportAnalytics";
import { formatDate } from "../utils/reportAnalytics";
import { MetricCard } from "./MetricCard";

type DashboardOverviewProps = {
  error: string | null;
  metrics: DashboardMetrics;
  onRefresh: () => void;
};

export function DashboardOverview({
  error,
  metrics,
  onRefresh,
}: DashboardOverviewProps) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">BugLens SDK / Developer Portal</p>
          <h1>BugLens dashboard.</h1>
          <p className="subtitle">
            Centralized crash and bug reporting for Android teams: inspect device
            context, prioritize open issues, and manage the full triage lifecycle from
            one command center.
          </p>
        </div>

        <div className="hero-actions">
          <div className="hero-stat">
            <span className="section-label">Latest signal</span>
            <strong>{metrics.latestReportAt}</strong>
          </div>

          <button className="refresh-button" onClick={onRefresh}>
            Refresh reports
          </button>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="kpi-grid">
        <MetricCard label="Total reports" value={metrics.totalReports.toString()} />
        <MetricCard
          label="Total crashes"
          value={metrics.totalCrashes.toString()}
          tone="danger"
        />
        <MetricCard
          label="Critical bugs"
          value={metrics.criticalReports.toString()}
          tone="danger"
        />
        <MetricCard
          label="Needs attention"
          value={metrics.openReports.toString()}
          tone="danger"
        />
        <MetricCard
          label="In investigation"
          value={metrics.inProgressReports.toString()}
          tone="warning"
        />
        <MetricCard
          label="Resolution rate"
          value={`${metrics.resolutionRate}%`}
          tone="success"
        />
        <MetricCard label="Affected users" value={metrics.affectedUsers.toString()} />
        <MetricCard label="Top screen" value={metrics.topScreen} />
        <MetricCard label="Top feature" value={metrics.topFeature} />
        <MetricCard label="Top device" value={metrics.topDevice} />
        <MetricCard label="Top Android" value={metrics.topAndroid} />
        <MetricCard label="Top app version" value={metrics.topAppVersion} />
      </section>

      <section className="focus-grid">
        {metrics.focusCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            helper={card.helper}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="insight-panel">
        <div>
          <span className="section-label">Operational summary</span>
          <h2>
            {metrics.totalCrashes > 0
              ? `${metrics.totalCrashes} crash reports captured automatically`
              : metrics.criticalReports > 0
                ? `${metrics.criticalReports} critical bugs require immediate attention`
                : metrics.unresolvedReports > 0
                  ? `${metrics.unresolvedReports} reports still require engineering attention`
                  : "All reports are currently handled"}
          </h2>
          <p>
            {metrics.oldestOpenReport
              ? `Oldest open report is "${metrics.oldestOpenReport.title}", reported by ${
                  metrics.oldestOpenReport.user_id || "Anonymous"
                } on ${formatDate(metrics.oldestOpenReport.created_at)} from ${
                  metrics.oldestOpenReport.device_model || "Unknown device"
                }.`
              : "No open reports are waiting for initial triage."}
          </p>
        </div>

        <div>
          <span className="section-label">Metadata intelligence</span>
          <h2>{metrics.topFeature}</h2>
          <p>
            Most reported feature. The most affected screen is{" "}
            <strong>{metrics.topScreen}</strong>, the top reporting user is{" "}
            <strong>{metrics.topUser}</strong>, and the most impacted manufacturer is{" "}
            <strong>{metrics.topManufacturer}</strong>.
          </p>
        </div>
      </section>
    </>
  );
}
