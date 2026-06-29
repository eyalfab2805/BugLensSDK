export type ReportStatus = "open" | "in_progress" | "resolved" | "closed";
export type ReportSeverity = "Low" | "Medium" | "High" | "Critical";
export type ReportType = "bug" | "crash";

export type BugReport = {
  report_id: string;
  api_key: string;
  user_id: string | null;
  title: string;
  description: string;
  severity: ReportSeverity;
  report_type: ReportType;
  stack_trace: string | null;
  device_model: string | null;
  manufacturer: string | null;
  android_version: string | null;
  app_version: string | null;
  screenshot_path: string | null;
  metadata?: Record<string, string> | null;
  status: ReportStatus;
  created_at: string | null;
};

export type CountItem = {
  name: string;
  value: number;
};

export type TimeItem = {
  date: string;
  reports: number;
};

export type ChartClickData = {
  name?: string;
  payload?: {
    name?: string;
    date?: string;
  };
};

export type ReportFilters = {
  status: ReportStatus | "all";
  severity: ReportSeverity | "all";
  reportType: ReportType | "all";
  appVersion: string;
  search: string;
  screenshotOnly: boolean;
};

export type PriorityBucket = {
  label: string;
  helper: string;
  tone: "danger" | "warning" | "success";
  reports: BugReport[];
};

export type ClusterSummary = {
  key: string;
  title: string;
  reportType: ReportType;
  severity: ReportSeverity;
  count: number;
  affectedUsers: number;
  latestSeen: string | null;
  appVersions: string[];
  exemplar: BugReport;
};

export type ReleaseHealthSummary = {
  version: string;
  totalReports: number;
  crashReports: number;
  openReports: number;
  criticalReports: number;
  latestSeen: string | null;
};

export type ReleaseDiagnostics = {
  topFeature: string;
  topScreen: string;
  topClusterTitle: string;
  topClusterCount: number;
};

export type IssueGroupSummary = {
  fingerprint: string;
  title: string;
  report_type: ReportType;
  severity: ReportSeverity;
  total_reports: number;
  unresolved_reports: number;
  affected_users: number;
  latest_seen: string | null;
  app_versions: string[];
  representative_report_id: string;
};
