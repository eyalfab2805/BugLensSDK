from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4
from fastapi.staticfiles import StaticFiles
import json
import os

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Report
from schemas import (
    IssueGroupOut,
    ReportCreate,
    ReportOut,
    ReportResponse,
    StatusUpdate,
)


Base.metadata.create_all(bind=engine)

app = FastAPI(title="BugLens API")

os.makedirs("uploads", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_STATUSES = [
    "open",
    "in_progress",
    "resolved",
    "closed",
]

VALID_REPORT_TYPES = [
    "bug",
    "crash",
]

SEVERITY_RANK = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Critical": 4,
}


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
        created_at=datetime.fromtimestamp(report.created_at / 1000)
        if report.created_at
        else None,
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


def get_priority_score(report: ReportOut) -> int:
    severity_score = SEVERITY_RANK.get(report.severity, 2) * 20
    unresolved_score = 20 if report.status in {"open", "in_progress"} else 0
    crash_score = 12 if report.report_type == "crash" else 0
    screenshot_score = 4 if report.screenshot_path else 0
    recency_score = 8 if is_recent(report.created_at, 24) else 0
    return severity_score + unresolved_score + crash_score + screenshot_score + recency_score


def is_recent(value: Optional[datetime], hours: int) -> bool:
    if value is None:
      return False

    return value.timestamp() >= datetime.now().timestamp() - hours * 60 * 60


def get_top_severity(reports: List[ReportOut]) -> str:
    return max(
        (report.severity for report in reports),
        key=lambda severity: SEVERITY_RANK.get(severity, 0),
        default="Low",
    )


def apply_report_filters(
    reports: List[ReportOut],
    status: Optional[str],
    severity: Optional[str],
    report_type: Optional[str],
    app_version: Optional[str],
    screenshot_only: bool,
    search: Optional[str],
) -> List[ReportOut]:
    filtered = reports

    if status:
        filtered = [report for report in filtered if report.status == status]

    if severity:
        filtered = [report for report in filtered if report.severity == severity]

    if report_type:
        filtered = [report for report in filtered if report.report_type == report_type]

    if app_version:
        filtered = [
            report
            for report in filtered
            if (report.app_version or "Unknown") == app_version
        ]

    if screenshot_only:
        filtered = [report for report in filtered if report.screenshot_path]

    if not search:
        return filtered

    normalized_search = search.strip().lower()
    return [
        report
        for report in filtered
        if normalized_search
        in " ".join(
            [
                report.title,
                report.description,
                report.report_id,
                report.user_id or "",
                report.device_model or "",
                report.manufacturer or "",
                report.android_version or "",
                report.app_version or "",
                report.stack_trace or "",
                report.metadata.get("screen", "") if report.metadata else "",
                report.metadata.get("feature", "") if report.metadata else "",
            ]
        ).lower()
    ]


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
        priority_score = sum(get_priority_score(report) for report in unresolved_reports[:5])
        priority_score += min(len(sorted_items), 10) * 3
        priority_score += len(affected_users) * 5

        issue_groups.append(
            IssueGroupOut(
                fingerprint=fingerprint,
                title=get_group_title(sorted_items[0]),
                report_type=sorted_items[0].report_type,
                severity=severity,
                total_reports=len(sorted_items),
                unresolved_reports=len(unresolved_reports),
                affected_users=len(affected_users),
                priority_score=priority_score,
                latest_seen=sorted_items[0].created_at,
                app_versions=app_versions[:5],
                representative_report_id=sorted_items[0].report_id,
            )
        )

    return sorted(
        issue_groups,
        key=lambda group: (
            group.priority_score,
            group.total_reports,
            group.latest_seen or datetime.fromtimestamp(0),
        ),
        reverse=True,
    )


@app.post("/upload-screenshot")
async def upload_screenshot(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {"url": f"http://10.0.2.2:8000/{file_path}"}


@app.post("/reports", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    if report.report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Report type must be one of {VALID_REPORT_TYPES}",
        )

    report_id = report.report_id or str(uuid4())
    created_at = int(datetime.now().timestamp() * 1000)

    existing_report = db.query(Report).filter(Report.report_id == report_id).first()

    if existing_report is not None:
        return ReportResponse(success=True, report_id=existing_report.report_id)

    db_report = Report(
        report_id=report_id,
        api_key=report.api_key,
        user_id=report.user_id,
        title=report.title,
        description=report.description,
        device_model=report.device_model,
        manufacturer=report.manufacturer,
        android_version=report.android_version,
        app_version=report.app_version,
        screenshot_path=report.screenshot_path,
        metadata_json=json.dumps(report.metadata or {}),
        severity=report.severity,
        report_type=report.report_type,
        stack_trace=report.stack_trace,
        status="open",
        created_at=created_at,
    )

    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return ReportResponse(success=True, report_id=report_id)


@app.get("/reports", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [report_to_out(report) for report in reports]


@app.get("/reports/status/{status}", response_model=List[ReportOut])
def get_reports_by_status(status: str, db: Session = Depends(get_db)):
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {VALID_STATUSES}",
        )

    reports = (
        db.query(Report)
        .filter(Report.status == status)
        .order_by(Report.created_at.desc())
        .all()
    )

    return [report_to_out(report) for report in reports]


@app.get("/reports/type/{report_type}", response_model=List[ReportOut])
def get_reports_by_type(report_type: str, db: Session = Depends(get_db)):
    if report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Report type must be one of {VALID_REPORT_TYPES}",
        )

    reports = (
        db.query(Report)
        .filter(Report.report_type == report_type)
        .order_by(Report.created_at.desc())
        .all()
    )

    return [report_to_out(report) for report in reports]


@app.get("/issues/groups", response_model=List[IssueGroupOut])
def get_issue_groups(
    status: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    report_type: Optional[str] = Query(default=None),
    app_version: Optional[str] = Query(default=None),
    screenshot_only: bool = Query(default=False),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    if status is not None and status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {VALID_STATUSES}",
        )

    if report_type is not None and report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Report type must be one of {VALID_REPORT_TYPES}",
        )

    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    report_out_items = [report_to_out(report) for report in reports]
    filtered_reports = apply_report_filters(
        report_out_items,
        status=status,
        severity=severity,
        report_type=report_type,
        app_version=app_version,
        screenshot_only=screenshot_only,
        search=search,
    )
    return to_issue_groups(filtered_reports)


@app.get("/reports/{report_id}", response_model=ReportOut)
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.report_id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return report_to_out(report)


@app.patch("/reports/{report_id}/status", response_model=ReportOut)
def update_report_status(
    report_id: str,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.report_id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if status_update.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {VALID_STATUSES}",
        )

    report.status = status_update.status

    db.commit()
    db.refresh(report)

    return report_to_out(report)
