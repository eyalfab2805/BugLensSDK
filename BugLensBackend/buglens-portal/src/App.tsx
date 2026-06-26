import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import "./App.css";
import { AnalyticsSection } from "./components/AnalyticsSection";
import { DashboardOverview } from "./components/DashboardOverview";
import { ImageModal } from "./components/ImageModal";
import { ReportDetailsPanel } from "./components/ReportDetailsPanel";
import { ReportsTablePanel } from "./components/ReportsTablePanel";
import { API_BASE_URL } from "./constants/reports";
import type { BugReport, ReportStatus } from "./types/reports";
import {
  buildDashboardMetrics,
  getScreenshotUrl,
} from "./utils/reportAnalytics";

function App() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        statusFilter === "all"
          ? `${API_BASE_URL}/reports`
          : `${API_BASE_URL}/reports/status/${statusFilter}`;

      const response = await axios.get<BugReport[]>(endpoint);
      const sortedReports = [...response.data].sort(
        (left, right) =>
          new Date(right.created_at || 0).getTime() -
          new Date(left.created_at || 0).getTime()
      );

      setReports(sortedReports);

      if (sortedReports.length === 0) {
        setSelectedReport(null);
        return;
      }

      const existingSelection = sortedReports.find(
        (report) => report.report_id === selectedReport?.report_id
      );
      setSelectedReport(existingSelection || sortedReports[0]);
    } catch {
      setError("Could not load reports. Make sure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchReports();
  }, [statusFilter]);

  function openRelevantReport(matcher: (report: BugReport) => boolean) {
    const match = reports.find(matcher);

    if (!match) {
      return;
    }

    setSelectedReport(match);

    window.setTimeout(() => {
      document.querySelector(".details-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function updateStatus(reportId: string, newStatus: ReportStatus) {
    const response = await axios.patch<BugReport>(
      `${API_BASE_URL}/reports/${reportId}/status`,
      { status: newStatus }
    );

    const updatedReport = response.data;

    setReports((previousReports) =>
      previousReports.map((report) =>
        report.report_id === reportId ? updatedReport : report
      )
    );
    setSelectedReport(updatedReport);
  }

  const metrics = useMemo(() => buildDashboardMetrics(reports), [reports]);

  return (
    <main className="app">
      <DashboardOverview error={error} metrics={metrics} onRefresh={fetchReports} />

      <AnalyticsSection
        metrics={metrics}
        onOpenRelevantReport={openRelevantReport}
      />

      <section className="workspace-grid">
        <ReportsTablePanel
          loading={loading}
          reports={reports}
          selectedReport={selectedReport}
          statusFilter={statusFilter}
          onSelectReport={setSelectedReport}
          onStatusFilterChange={setStatusFilter}
        />

        <ReportDetailsPanel
          selectedReport={selectedReport}
          onUpdateStatus={updateStatus}
          onPreviewImage={(path) => setImagePreviewUrl(getScreenshotUrl(path))}
        />
      </section>

      <ImageModal imageUrl={imagePreviewUrl} onClose={() => setImagePreviewUrl(null)} />
    </main>
  );
}

export default App;
