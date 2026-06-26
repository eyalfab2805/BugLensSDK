import {
  reportTypeLabels,
  reportTypes,
  severities,
  statusLabels,
  statuses,
} from "../constants/reports";
import type {
  BugReport,
  ClusterSummary,
  CountItem,
  PriorityBucket,
  ReleaseDiagnostics,
  ReleaseHealthSummary,
  ReportFilters,
  TimeItem,
} from "../types/reports";

const staleReportDays = 3;
const recentReportHours = 24;

export type DashboardMetrics = {
  totalReports: number;
  totalCrashes: number;
  criticalReports: number;
  openReports: number;
  inProgressReports: number;
  resolvedReports: number;
  unresolvedReports: number;
  affectedUsers: number;
  resolutionRate: number;
  criticalOpenReports: number;
  recentReports: number;
  staleOpenReports: number;
  screenshotCoverage: number;
  topDevice: string;
  topAndroid: string;
  topAppVersion: string;
  topManufacturer: string;
  topUser: string;
  topScreen: string;
  topFeature: string;
  latestReportAt: string;
  oldestOpenReport: BugReport | undefined;
  focusCards: Array<{
    label: string;
    value: string;
    helper: string;
    tone?: "danger" | "warning" | "success";
  }>;
  statusChartData: CountItem[];
  severityChartData: CountItem[];
  reportTypeChartData: CountItem[];
  androidChartData: CountItem[];
  deviceChartData: CountItem[];
  appVersionChartData: CountItem[];
  screenChartData: CountItem[];
  featureChartData: CountItem[];
  reportsOverTime: TimeItem[];
};

export function getMetadataValue(report: BugReport, key: string): string {
  return report.metadata?.[key]?.trim() || "Unknown";
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
}

export function getScreenshotUrl(path: string): string {
  return path.replace("10.0.2.2", "127.0.0.1");
}

export function filterReports(
  reports: BugReport[],
  filters: ReportFilters,
  deferredSearch: string
): BugReport[] {
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  return reports.filter((report) => {
    if (filters.status !== "all" && report.status !== filters.status) {
      return false;
    }

    if (filters.severity !== "all" && report.severity !== filters.severity) {
      return false;
    }

    if (filters.reportType !== "all" && report.report_type !== filters.reportType) {
      return false;
    }

    if (
      filters.appVersion !== "all" &&
      (report.app_version || "Unknown") !== filters.appVersion
    ) {
      return false;
    }

    if (filters.screenshotOnly && !report.screenshot_path) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      report.title,
      report.description,
      report.report_id,
      report.user_id,
      report.device_model,
      report.manufacturer,
      report.android_version,
      report.app_version,
      report.stack_trace,
      getMetadataValue(report, "screen"),
      getMetadataValue(report, "feature"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

export function getAvailableAppVersions(reports: BugReport[]): string[] {
  return Array.from(new Set(reports.map((report) => report.app_version || "Unknown"))).sort(
    compareVersionValues
  );
}

export function buildDashboardMetrics(reports: BugReport[]): DashboardMetrics {
  const totalReports = reports.length;
  const totalCrashes = reports.filter((report) => report.report_type === "crash").length;
  const criticalReports = reports.filter((report) => report.severity === "Critical").length;
  const openReports = reports.filter((report) => report.status === "open").length;
  const inProgressReports = reports.filter(
    (report) => report.status === "in_progress"
  ).length;
  const resolvedReports = reports.filter(
    (report) => report.status === "resolved" || report.status === "closed"
  ).length;
  const unresolvedReports = openReports + inProgressReports;
  const affectedUsers = new Set(reports.map((report) => report.user_id || "Anonymous")).size;
  const resolutionRate =
    totalReports === 0 ? 0 : Math.round((resolvedReports / totalReports) * 100);
  const criticalOpenReports = reports.filter(
    (report) =>
      report.severity === "Critical" &&
      (report.status === "open" || report.status === "in_progress")
  ).length;
  const recentReports = reports.filter((report) =>
    isRecent(report.created_at, recentReportHours)
  ).length;
  const staleOpenReports = reports.filter(
    (report) => report.status === "open" && getAgeInDays(report.created_at) >= staleReportDays
  ).length;
  const screenshotCoverage =
    totalReports === 0
      ? 0
      : Math.round(
          (reports.filter((report) => Boolean(report.screenshot_path)).length / totalReports) *
            100
        );

  const topDevice = getTopValue(reports, (report) => report.device_model || "Unknown");
  const topAndroid = getTopValue(reports, (report) => report.android_version || "Unknown");
  const topAppVersion = getTopValue(reports, (report) => report.app_version || "Unknown");
  const topManufacturer = getTopValue(
    reports,
    (report) => report.manufacturer || "Unknown"
  );
  const topUser = getTopValue(reports, (report) => report.user_id || "Anonymous");
  const topScreen = getTopValue(reports, (report) => getMetadataValue(report, "screen"));
  const topFeature = getTopValue(reports, (report) => getMetadataValue(report, "feature"));

  const latestReport = reports.find((report) => Boolean(report.created_at));
  const latestReportAt = latestReport?.created_at
    ? formatDate(latestReport.created_at)
    : "N/A";

  const oldestOpenReport = reports
    .filter((report) => report.status === "open" && report.created_at)
    .sort(
      (left, right) =>
        new Date(left.created_at || "").getTime() -
        new Date(right.created_at || "").getTime()
    )[0];

  return {
    totalReports,
    totalCrashes,
    criticalReports,
    openReports,
    inProgressReports,
    resolvedReports,
    unresolvedReports,
    affectedUsers,
    resolutionRate,
    criticalOpenReports,
    recentReports,
    staleOpenReports,
    screenshotCoverage,
    topDevice,
    topAndroid,
    topAppVersion,
    topManufacturer,
    topUser,
    topScreen,
    topFeature,
    latestReportAt,
    oldestOpenReport,
    focusCards: [
      {
        label: "New in 24h",
        value: recentReports.toString(),
        helper: "Fresh incoming volume across all statuses.",
        tone: recentReports > 0 ? "warning" : "success",
      },
      {
        label: "Critical unresolved",
        value: criticalOpenReports.toString(),
        helper: "Critical reports still open or under investigation.",
        tone: criticalOpenReports > 0 ? "danger" : "success",
      },
      {
        label: "Stale open issues",
        value: staleOpenReports.toString(),
        helper: `Open for ${staleReportDays}+ days without first resolution.`,
        tone: staleOpenReports > 0 ? "warning" : "success",
      },
      {
        label: "Screenshot coverage",
        value: `${screenshotCoverage}%`,
        helper: "Reports carrying a screenshot for visual debugging.",
      },
    ],
    statusChartData: statuses.map((status) => ({
      name: statusLabels[status],
      value: reports.filter((report) => report.status === status).length,
    })),
    severityChartData: severities.map((severity) => ({
      name: severity,
      value: reports.filter((report) => report.severity === severity).length,
    })),
    reportTypeChartData: reportTypes.map((type) => ({
      name: reportTypeLabels[type],
      value: reports.filter((report) => report.report_type === type).length,
    })),
    androidChartData: toCountItems(reports, (report) => report.android_version || "Unknown"),
    deviceChartData: toCountItems(reports, (report) => report.device_model || "Unknown").slice(
      0,
      6
    ),
    appVersionChartData: toCountItems(
      reports,
      (report) => report.app_version || "Unknown"
    ),
    screenChartData: toCountItems(reports, (report) => getMetadataValue(report, "screen")).slice(
      0,
      8
    ),
    featureChartData: toCountItems(
      reports,
      (report) => getMetadataValue(report, "feature")
    ).slice(0, 8),
    reportsOverTime: toReportsOverTime(reports),
  };
}

export function buildPriorityBuckets(reports: BugReport[]): PriorityBucket[] {
  const unresolvedCritical = reports
    .filter(
      (report) =>
        report.severity === "Critical" &&
        (report.status === "open" || report.status === "in_progress")
    )
    .slice(0, 5);

  const staleOpen = reports
    .filter(
      (report) => report.status === "open" && getAgeInDays(report.created_at) >= staleReportDays
    )
    .sort(
      (left, right) =>
        new Date(left.created_at || 0).getTime() - new Date(right.created_at || 0).getTime()
    )
    .slice(0, 5);

  const recentCrashes = reports
    .filter(
      (report) =>
        report.report_type === "crash" && isRecent(report.created_at, recentReportHours)
    )
    .slice(0, 5);

  return [
    {
      label: "Critical unresolved",
      helper: "Highest urgency items still not resolved.",
      tone: unresolvedCritical.length > 0 ? "danger" : "success",
      reports: unresolvedCritical,
    },
    {
      label: "Stale open",
      helper: `Open for ${staleReportDays}+ days and still untouched.`,
      tone: staleOpen.length > 0 ? "warning" : "success",
      reports: staleOpen,
    },
    {
      label: "New crashes",
      helper: "Fresh crash reports in the last 24 hours.",
      tone: recentCrashes.length > 0 ? "warning" : "success",
      reports: recentCrashes,
    },
  ];
}

export function buildIssueClusters(reports: BugReport[]): ClusterSummary[] {
  const groups = new Map<string, BugReport[]>();

  reports.forEach((report) => {
    const fingerprint = getClusterFingerprint(report);
    const existing = groups.get(fingerprint) || [];
    existing.push(report);
    groups.set(fingerprint, existing);
  });

  return Array.from(groups.entries())
    .map(([key, items]) => {
      const exemplar = items[0];
      const sortedVersions = Array.from(
        new Set(items.map((report) => report.app_version || "Unknown"))
      ).sort(compareVersionValues);

      return {
        key,
        title: getClusterTitle(exemplar),
        reportType: exemplar.report_type,
        severity: highestSeverity(items),
        count: items.length,
        affectedUsers: new Set(items.map((report) => report.user_id || "Anonymous")).size,
        latestSeen: items[0]?.created_at || null,
        appVersions: sortedVersions.slice(0, 3),
        exemplar,
      };
    })
    .sort((left, right) => {
      const severityGap = severityRank(right.severity) - severityRank(left.severity);
      if (severityGap !== 0) {
        return severityGap;
      }

      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return (
        new Date(right.latestSeen || 0).getTime() - new Date(left.latestSeen || 0).getTime()
      );
    })
    .slice(0, 8);
}

export function buildReleaseHealth(reports: BugReport[]): ReleaseHealthSummary[] {
  const grouped = new Map<string, BugReport[]>();

  reports.forEach((report) => {
    const version = report.app_version || "Unknown";
    const existing = grouped.get(version) || [];
    existing.push(report);
    grouped.set(version, existing);
  });

  return Array.from(grouped.entries())
    .map(([version, items]) => ({
      version,
      totalReports: items.length,
      crashReports: items.filter((report) => report.report_type === "crash").length,
      openReports: items.filter(
        (report) => report.status === "open" || report.status === "in_progress"
      ).length,
      criticalReports: items.filter((report) => report.severity === "Critical").length,
      latestSeen: items[0]?.created_at || null,
    }))
    .sort((left, right) => {
      const versionOrder = compareVersionValues(left.version, right.version);
      if (versionOrder !== 0) {
        return versionOrder;
      }

      return right.totalReports - left.totalReports;
    })
    .slice(0, 6);
}

export function buildReleaseDiagnostics(reports: BugReport[]): ReleaseDiagnostics {
  const clusters = buildIssueClusters(reports);

  return {
    topFeature: getTopValue(reports, (report) => getMetadataValue(report, "feature")),
    topScreen: getTopValue(reports, (report) => getMetadataValue(report, "screen")),
    topClusterTitle: clusters[0]?.title || "N/A",
    topClusterCount: clusters[0]?.count || 0,
  };
}

function getTopValue(
  reports: BugReport[],
  selector: (report: BugReport) => string
): string {
  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    const value = selector(report);
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || "N/A";
}

function toCountItems(
  reports: BugReport[],
  selector: (report: BugReport) => string
): CountItem[] {
  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    const value = selector(report);
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
}

function toReportsOverTime(reports: BugReport[]): TimeItem[] {
  const counts: Record<string, number> = {};

  reports.forEach((report) => {
    const date = report.created_at
      ? new Date(report.created_at).toLocaleDateString()
      : "Unknown";

    counts[date] = (counts[date] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([date, count]) => ({ date, reports: count }))
    .sort(
      (left, right) =>
        normalizeTimeValue(left.date).getTime() - normalizeTimeValue(right.date).getTime()
    );
}

function isRecent(value: string | null, hours: number): boolean {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() >= Date.now() - hours * 60 * 60 * 1000;
}

function getAgeInDays(value: string | null): number {
  if (!value) {
    return 0;
  }

  return Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
}

function normalizeTimeValue(value: string): Date {
  return value === "Unknown" ? new Date(0) : new Date(value);
}

function getClusterFingerprint(report: BugReport): string {
  if (report.report_type === "crash" && report.stack_trace) {
    return firstMeaningfulLine(report.stack_trace).toLowerCase();
  }

  return `${report.report_type}:${report.title.trim().toLowerCase()}`;
}

function getClusterTitle(report: BugReport): string {
  if (report.report_type === "crash" && report.stack_trace) {
    return firstMeaningfulLine(report.stack_trace);
  }

  return report.title;
}

function firstMeaningfulLine(stackTrace: string): string {
  return (
    stackTrace
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) || "Unknown crash signature"
  );
}

function highestSeverity(reports: BugReport[]) {
  return reports.reduce(
    (current, report) =>
      severityRank(report.severity) > severityRank(current) ? report.severity : current,
    reports[0]?.severity || "Low"
  );
}

function severityRank(value: BugReport["severity"]): number {
  switch (value) {
    case "Critical":
      return 4;
    case "High":
      return 3;
    case "Medium":
      return 2;
    default:
      return 1;
  }
}

function compareVersionValues(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (left === "Unknown") {
    return 1;
  }

  if (right === "Unknown") {
    return -1;
  }

  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const gap = (rightParts[index] || 0) - (leftParts[index] || 0);
    if (gap !== 0) {
      return gap;
    }
  }

  return right.localeCompare(left);
}
