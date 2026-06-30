from collections import Counter
from datetime import datetime
import json
from typing import Dict, Iterable, List, Optional

from models import Report
from schemas import AnalyticsSummaryOut, BreakdownItem, IssueGroupOut, ReportOut


SEVERITY_RANK = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Critical": 4,
}


def now_millis() -> int:
    return int(datetime.now().timestamp() * 1000)


def to_datetime(timestamp_ms: Optional[int]) -> Optional[datetime]:
    if not timestamp_ms:
        return None
    return datetime.fromtimestamp(timestamp_ms / 1000)


def report_to_out(report: Report) -> ReportOut:
    return ReportOut(
        report_id=report.report_id,
        api_key=report.api_key,
        user_id=report.user_id,
        title=report.title,
        description=report.description,
        device_model=report.device_model,
        manufacturer=report.manufacturer,
        android_version=report.android_version,
        app_version=report.app_version,
        screenshot_path=report.screenshot_path,
        metadata=json.loads(report.metadata_json or "{}"),
        severity=report.severity or "Medium",
        report_type=report.report_type or "bug",
        stack_trace=report.stack_trace,
        status=report.status,
        created_at=to_datetime(report.created_at),
    )


def normalize_fingerprint(report: ReportOut) -> str:
    if report.report_type == "crash" and report.stack_trace:
        first_line = next(
            (line.strip() for line in report.stack_trace.splitlines() if line.strip()),
            "unknown crash signature",
        )
        return f"crash:{first_line.lower()}"

    return f"{report.report_type}:{report.title.strip().lower()}"


def get_group_title(report: ReportOut) -> str:
    if report.report_type == "crash" and report.stack_trace:
        return next(
            (line.strip() for line in report.stack_trace.splitlines() if line.strip()),
            report.title,
        )

    return report.title


def get_top_severity(reports: List[ReportOut]) -> str:
    return max(
        (report.severity for report in reports),
        key=lambda severity: SEVERITY_RANK.get(severity, 0),
        default="Low",
    )


def to_issue_groups(reports: List[ReportOut]) -> List[IssueGroupOut]:
    grouped: Dict[str, List[ReportOut]] = {}

    for report in reports:
        fingerprint = normalize_fingerprint(report)
        grouped.setdefault(fingerprint, []).append(report)

    issue_groups: List[IssueGroupOut] = []

    for fingerprint, items in grouped.items():
        sorted_items = sorted(
            items,
            key=lambda report: report.created_at or datetime.fromtimestamp(0),
            reverse=True,
        )
        unresolved_reports = [
            report for report in sorted_items if report.status in {"open", "in_progress"}
        ]
        affected_users = {report.user_id or "Anonymous" for report in sorted_items}
        app_versions = sorted(
            {report.app_version or "Unknown" for report in sorted_items},
            reverse=True,
        )
        severity = get_top_severity(sorted_items)

        issue_groups.append(
            IssueGroupOut(
                fingerprint=fingerprint,
                title=get_group_title(sorted_items[0]),
                report_type=sorted_items[0].report_type,
                severity=severity,
                total_reports=len(sorted_items),
                unresolved_reports=len(unresolved_reports),
                affected_users=len(affected_users),
                latest_seen=sorted_items[0].created_at,
                app_versions=app_versions[:5],
                representative_report_id=sorted_items[0].report_id,
            )
        )

    return sorted(
        issue_groups,
        key=lambda group: (
            SEVERITY_RANK.get(group.severity, 0),
            group.unresolved_reports,
            group.total_reports,
            group.latest_seen or datetime.fromtimestamp(0),
        ),
        reverse=True,
    )


def count_top_value(values: Iterable[str]) -> str:
    counts = Counter(value for value in values if value)
    return counts.most_common(1)[0][0] if counts else "N/A"


def to_breakdown_items(values: Iterable[str], limit: int = 8) -> List[BreakdownItem]:
    counts = Counter(value for value in values if value)
    return [BreakdownItem(label=label, count=count) for label, count in counts.most_common(limit)]


def build_analytics_summary(reports: List[Report]) -> AnalyticsSummaryOut:
    latest_report_at = to_datetime(reports[0].created_at) if reports else None

    return AnalyticsSummaryOut(
        total_reports=len(reports),
        open_reports=sum(1 for report in reports if report.status == "open"),
        in_progress_reports=sum(1 for report in reports if report.status == "in_progress"),
        resolved_reports=sum(
            1 for report in reports if report.status in {"resolved", "closed"}
        ),
        crash_reports=sum(1 for report in reports if report.report_type == "crash"),
        bug_reports=sum(1 for report in reports if report.report_type == "bug"),
        critical_reports=sum(1 for report in reports if report.severity == "Critical"),
        screenshot_reports=sum(1 for report in reports if report.screenshot_path),
        affected_users=len({report.user_id or "Anonymous" for report in reports}),
        top_device=count_top_value(report.device_model or "Unknown" for report in reports),
        top_android_version=count_top_value(
            report.android_version or "Unknown" for report in reports
        ),
        top_app_version=count_top_value(report.app_version or "Unknown" for report in reports),
        top_feature=count_top_value(
            json.loads(report.metadata_json or "{}").get("feature", "Unknown")
            for report in reports
        ),
        top_screen=count_top_value(
            json.loads(report.metadata_json or "{}").get("screen", "Unknown")
            for report in reports
        ),
        top_manufacturer=count_top_value(
            report.manufacturer or "Unknown" for report in reports
        ),
        latest_report_at=latest_report_at,
        device_breakdown=to_breakdown_items(
            (report.device_model or "Unknown") for report in reports
        ),
        app_version_breakdown=to_breakdown_items(
            (report.app_version or "Unknown") for report in reports
        ),
        severity_breakdown=to_breakdown_items(
            (report.severity for report in reports),
            limit=4,
        ),
    )
