import { reportTypes, severities, statuses, statusLabels } from "../constants/reports";
import type { ReportFilters } from "../types/reports";

type FilterToolbarProps = {
  filters: ReportFilters;
  appVersions: string[];
  resultCount: number;
  totalCount: number;
  onChange: (next: ReportFilters) => void;
  onReset: () => void;
};

export function FilterToolbar({
  filters,
  appVersions,
  resultCount,
  totalCount,
  onChange,
  onReset,
}: FilterToolbarProps) {
  return (
    <section className="panel filter-toolbar">
      <div className="panel-header">
        <div>
          <span className="section-label">Filtering and focus</span>
          <h2>Investigate the right slice</h2>
        </div>

        <div className="filter-summary">
          <strong>{resultCount}</strong>
          <span>of {totalCount} reports shown</span>
        </div>
      </div>

      <div className="filter-grid">
        <label className="filter-field filter-field-search">
          <span>Search</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Title, stack trace, user, device, feature..."
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </label>

        <label className="filter-field">
          <span>Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as ReportFilters["status"] })
            }
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Severity</span>
          <select
            value={filters.severity}
            onChange={(event) =>
              onChange({
                ...filters,
                severity: event.target.value as ReportFilters["severity"],
              })
            }
          >
            <option value="all">All severities</option>
            {severities.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Type</span>
          <select
            value={filters.reportType}
            onChange={(event) =>
              onChange({
                ...filters,
                reportType: event.target.value as ReportFilters["reportType"],
              })
            }
          >
            <option value="all">All types</option>
            {reportTypes.map((reportType) => (
              <option key={reportType} value={reportType}>
                {reportType}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>App version</span>
          <select
            value={filters.appVersion}
            onChange={(event) => onChange({ ...filters, appVersion: event.target.value })}
          >
            <option value="all">All versions</option>
            {appVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={filters.screenshotOnly}
            onChange={(event) =>
              onChange({ ...filters, screenshotOnly: event.target.checked })
            }
          />
          <span>Only reports with screenshots</span>
        </label>

        <button className="secondary-button" onClick={onReset}>
          Clear filters
        </button>
      </div>
    </section>
  );
}
