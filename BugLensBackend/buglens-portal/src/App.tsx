import { useDeferredValue, useEffect, useMemo, useState } from "react";
import axios from "axios";

import "./App.css";
import { AnalyticsSection } from "./components/AnalyticsSection";
import { DashboardOverview } from "./components/DashboardOverview";
import { FilterToolbar } from "./components/FilterToolbar";
import { ImageModal } from "./components/ImageModal";
import { IssueClustersPanel } from "./components/IssueClustersPanel";
import { PriorityQueuePanel } from "./components/PriorityQueuePanel";
import { ReleaseFocusPanel } from "./components/ReleaseFocusPanel";
import { ReleaseHealthPanel } from "./components/ReleaseHealthPanel";
import { ReportDetailsPanel } from "./components/ReportDetailsPanel";
import { ReportsTablePanel } from "./components/ReportsTablePanel";
import { ResolvedListPanel } from "./components/ResolvedListPanel";
import { TodoListPanel } from "./components/TodoListPanel";
import { ViewNavigation } from "./components/ViewNavigation";
import { API_BASE_URL } from "./constants/reports";
import type {
  BugReport,
  IssueGroupSummary,
  ReportFilters,
  ReportStatus,
} from "./types/reports";
import {
  buildDashboardMetrics,
  buildPriorityBuckets,
  buildReleaseDiagnostics,
  buildReleaseHealth,
  filterReports,
  getAvailableAppVersions,
  getScreenshotUrl,
} from "./utils/reportAnalytics";

const defaultFilters: ReportFilters = {
  status: "all",
  severity: "all",
  reportType: "all",
  appVersion: "all",
  search: "",
  screenshotOnly: false,
};

type PortalView = "overview" | "triage" | "todo" | "resolved" | "releases" | "analytics";

function App() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [activeView, setActiveView] = useState<PortalView>("overview");
  const [releaseFocusVersion, setReleaseFocusVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [issueGroups, setIssueGroups] = useState<IssueGroupSummary[]>([]);
  const deferredSearch = useDeferredValue(filters.search);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<BugReport[]>(`${API_BASE_URL}/reports`);
      const sortedReports = [...response.data].sort(
        (left, right) =>
          new Date(right.created_at || 0).getTime() -
          new Date(left.created_at || 0).getTime()
      );

      setReports(sortedReports);
    } catch {
      setError("Could not load reports. Make sure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchReports();
  }, []);

  useEffect(() => {
    void fetchIssueGroups();
  }, [
    filters.status,
    filters.severity,
    filters.reportType,
    filters.appVersion,
    filters.screenshotOnly,
    deferredSearch,
  ]);

  const filteredReports = useMemo(
    () => filterReports(reports, filters, deferredSearch),
    [reports, filters, deferredSearch]
  );

  const actionableReports = useMemo(
    () =>
      filteredReports.filter(
        (report) => report.status !== "resolved" && report.status !== "closed"
      ),
    [filteredReports]
  );

  const todoReports = useMemo(
    () => reports.filter((report) => report.status === "in_progress"),
    [reports]
  );

  const resolvedReports = useMemo(
    () =>
      reports.filter(
        (report) => report.status === "resolved" || report.status === "closed"
      ),
    [reports]
  );

  const releaseHealth = useMemo(
    () => buildReleaseHealth(filteredReports),
    [filteredReports]
  );

  const focusedRelease =
    releaseHealth.find((release) => release.version === releaseFocusVersion) ||
    releaseHealth[0] ||
    null;

  const focusedReleaseReports = useMemo(() => {
    if (!focusedRelease) {
      return [];
    }

    return reports.filter(
      (report) => (report.app_version || "Unknown") === focusedRelease.version
    );
  }, [focusedRelease, reports]);

  const releaseDiagnostics = useMemo(
    () => buildReleaseDiagnostics(focusedReleaseReports),
    [focusedReleaseReports]
  );

  const visibleReports =
    activeView === "todo"
      ? todoReports
      : activeView === "triage"
        ? actionableReports
        : activeView === "resolved"
          ? resolvedReports
        : activeView === "releases"
          ? focusedReleaseReports
          : filteredReports;

  useEffect(() => {
    if (visibleReports.length === 0) {
      setSelectedReport(null);
      return;
    }

    const existingSelection = visibleReports.find(
      (report) => report.report_id === selectedReport?.report_id
    );

    setSelectedReport(existingSelection || visibleReports[0]);
  }, [visibleReports, selectedReport?.report_id]);

  function openRelevantReport(matcher: (report: BugReport) => boolean) {
    const match = filteredReports.find(matcher);

    if (!match) {
      return;
    }

    setSelectedReport(match);
    setActiveView("triage");

    window.setTimeout(() => {
      document.querySelector(".details-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function getNextActionableReport(reportId: string): BugReport | null {
    if (actionableReports.length === 0) {
      return null;
    }

    const currentIndex = actionableReports.findIndex(
      (report) => report.report_id === reportId
    );

    if (currentIndex === -1) {
      return actionableReports[0] || null;
    }

    return (
      actionableReports[currentIndex + 1] ||
      actionableReports[currentIndex - 1] ||
      null
    );
  }

  async function updateStatus(reportId: string, newStatus: ReportStatus) {
    try {
      setStatusUpdating(true);
      const nextActionableReport =
        activeView === "triage" &&
        (newStatus === "resolved" || newStatus === "closed")
          ? getNextActionableReport(reportId)
          : null;

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

      if (newStatus === "in_progress") {
        setActiveView("todo");
        setSelectedReport(updatedReport);
      } else if (newStatus === "resolved" || newStatus === "closed") {
        if (activeView === "triage" && nextActionableReport) {
          setSelectedReport(nextActionableReport);
        } else {
          setSelectedReport(updatedReport);
        }

        if (activeView !== "triage") {
          setActiveView("resolved");
        }
      } else {
        setSelectedReport(updatedReport);
      }

      if (
        activeView === "resolved" &&
        (newStatus === "open" || newStatus === "in_progress")
      ) {
        setActiveView(newStatus === "in_progress" ? "todo" : "triage");
      } else if (
        (newStatus === "resolved" || newStatus === "closed") &&
        activeView !== "triage"
      ) {
        setActiveView("resolved");
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  async function startWorking(reportId: string) {
    await updateStatus(reportId, "in_progress");
  }

  async function reopenBug(reportId: string) {
    await updateStatus(reportId, "open");
  }

  async function fetchIssueGroups() {
    const params: Record<string, string | boolean> = {};

    if (filters.status !== "all") {
      params.status = filters.status;
    }
    if (filters.severity !== "all") {
      params.severity = filters.severity;
    }
    if (filters.reportType !== "all") {
      params.report_type = filters.reportType;
    }
    if (filters.appVersion !== "all") {
      params.app_version = filters.appVersion;
    }
    if (filters.screenshotOnly) {
      params.screenshot_only = true;
    }
    if (deferredSearch.trim()) {
      params.search = deferredSearch.trim();
    }

    const response = await axios.get<IssueGroupSummary[]>(
      `${API_BASE_URL}/issues/groups`,
      { params }
    );

    setIssueGroups(response.data);
  }

  function selectReportById(reportId: string) {
    const match = reports.find((report) => report.report_id === reportId);
    if (!match) {
      return;
    }

    setSelectedReport(match);
    setActiveView(
      match.status === "in_progress"
        ? "todo"
        : match.status === "resolved" || match.status === "closed"
          ? "resolved"
          : "triage"
    );
  }

  const appVersions = useMemo(() => getAvailableAppVersions(reports), [reports]);
  const metrics = useMemo(() => buildDashboardMetrics(filteredReports), [filteredReports]);
  const priorityBuckets = useMemo(
    () => buildPriorityBuckets(filteredReports),
    [filteredReports]
  );

  return (
    <main className="app">
      <DashboardOverview error={error} metrics={metrics} onRefresh={fetchReports} />

      <ViewNavigation
        activeView={activeView}
        onChange={setActiveView}
        todoCount={todoReports.length}
        resolvedCount={resolvedReports.length}
      />

      {activeView === "triage" || activeView === "analytics" ? (
        <FilterToolbar
          filters={filters}
          appVersions={appVersions}
          resultCount={filteredReports.length}
          totalCount={reports.length}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
        />
      ) : null}

      {activeView === "overview" ? (
        <>
          <section className="triage-grid">
            <PriorityQueuePanel
              buckets={priorityBuckets}
              onSelectReport={(report) => {
                setSelectedReport(report);
                setActiveView("triage");
              }}
            />

            <ReleaseHealthPanel
              releases={releaseHealth}
              reports={filteredReports}
              onSelectVersion={(version) => {
                setReleaseFocusVersion(version);
                setActiveView("releases");
              }}
              onOpenReport={(report) => {
                setSelectedReport(report);
                setActiveView("releases");
                setReleaseFocusVersion(report.app_version || "Unknown");
              }}
            />
          </section>

          <IssueClustersPanel clusters={issueGroups} onOpenCluster={selectReportById} />
        </>
      ) : null}

      {activeView === "triage" ? (
        <>
          <section className="triage-grid">
            <PriorityQueuePanel buckets={priorityBuckets} onSelectReport={setSelectedReport} />

            <IssueClustersPanel clusters={issueGroups} onOpenCluster={selectReportById} />
          </section>

          <section className="workspace-grid">
            <ReportsTablePanel
              loading={loading}
              reports={actionableReports}
              selectedReport={selectedReport}
              resultCount={actionableReports.length}
              onSelectReport={setSelectedReport}
            />

            <ReportDetailsPanel
              selectedReport={selectedReport}
              onUpdateStatus={updateStatus}
              onPreviewImage={(path) => setImagePreviewUrl(getScreenshotUrl(path))}
              statusUpdating={statusUpdating}
              onStartWorking={startWorking}
              onOpenTodo={() => setActiveView("todo")}
              onReopen={reopenBug}
            />
          </section>
        </>
      ) : null}

      {activeView === "todo" ? (
        <section className="workspace-grid">
          <TodoListPanel
            reports={todoReports}
            selectedReport={selectedReport}
            onSelectReport={setSelectedReport}
          />

          <ReportDetailsPanel
            selectedReport={selectedReport}
            onUpdateStatus={updateStatus}
            onPreviewImage={(path) => setImagePreviewUrl(getScreenshotUrl(path))}
            statusUpdating={statusUpdating}
            onStartWorking={startWorking}
            onOpenTodo={() => setActiveView("todo")}
            onReopen={reopenBug}
          />
        </section>
      ) : null}

      {activeView === "resolved" ? (
        <section className="workspace-grid">
          <ResolvedListPanel
            reports={resolvedReports}
            selectedReport={selectedReport}
            onSelectReport={setSelectedReport}
          />

          <ReportDetailsPanel
            selectedReport={selectedReport}
            onUpdateStatus={updateStatus}
            onPreviewImage={(path) => setImagePreviewUrl(getScreenshotUrl(path))}
            statusUpdating={statusUpdating}
            onStartWorking={startWorking}
            onOpenTodo={() => setActiveView("todo")}
            onReopen={reopenBug}
          />
        </section>
      ) : null}

      {activeView === "releases" ? (
        <>
          <section className="triage-grid">
            <ReleaseHealthPanel
              releases={releaseHealth}
              reports={filteredReports}
              onSelectVersion={(version) => setReleaseFocusVersion(version)}
              onOpenReport={(report) => {
                setSelectedReport(report);
                setReleaseFocusVersion(report.app_version || "Unknown");
              }}
            />

            <IssueClustersPanel clusters={issueGroups} onOpenCluster={selectReportById} />
          </section>

          <section className="workspace-grid">
            <ReleaseFocusPanel
              release={focusedRelease}
              diagnostics={releaseDiagnostics}
              reports={focusedReleaseReports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onClearFocus={() => setReleaseFocusVersion(null)}
            />

            <ReportDetailsPanel
              selectedReport={selectedReport}
              onUpdateStatus={updateStatus}
              onPreviewImage={(path) => setImagePreviewUrl(getScreenshotUrl(path))}
              statusUpdating={statusUpdating}
              onStartWorking={startWorking}
              onOpenTodo={() => setActiveView("todo")}
              onReopen={reopenBug}
            />
          </section>
        </>
      ) : null}

      {activeView === "analytics" ? (
        <>
          <section className="triage-grid">
            <ReleaseHealthPanel
              releases={releaseHealth}
              reports={filteredReports}
              onSelectVersion={(version) => {
                setReleaseFocusVersion(version);
                setActiveView("releases");
              }}
              onOpenReport={(report) => {
                setSelectedReport(report);
                setActiveView("releases");
                setReleaseFocusVersion(report.app_version || "Unknown");
              }}
            />

            <IssueClustersPanel clusters={issueGroups} onOpenCluster={selectReportById} />
          </section>

          <AnalyticsSection metrics={metrics} onOpenRelevantReport={openRelevantReport} />
        </>
      ) : null}

      <ImageModal imageUrl={imagePreviewUrl} onClose={() => setImagePreviewUrl(null)} />
    </main>
  );
}

export default App;
