import {
  reportTypeLabels,
  reportTypes,
  statusLabels,
  statuses,
} from "../constants/reports";
import type {
  BugReport,
  CountItem,
  ReportSeverity,
  TimeItem,
} from "../types/reports";

const severities: ReportSeverity[] = ["Low", "Medium", "High", "Critical"];
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
