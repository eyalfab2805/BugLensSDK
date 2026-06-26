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
