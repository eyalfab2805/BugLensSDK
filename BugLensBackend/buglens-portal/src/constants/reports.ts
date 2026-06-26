import type { ReportStatus, ReportType } from "../types/reports";

export const API_BASE_URL = "http://127.0.0.1:8000";

export const statuses: ReportStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

export const reportTypes: ReportType[] = ["bug", "crash"];

export const statusLabels: Record<ReportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const reportTypeLabels: Record<ReportType, string> = {
  bug: "Bug",
  crash: "Crash",
};

export const chartColors = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
  "#c084fc",
];
