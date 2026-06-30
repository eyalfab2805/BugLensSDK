from typing import List, Optional
from uuid import uuid4
from fastapi.staticfiles import StaticFiles
import json
import os

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, ensure_database_schema, get_db
from db import (
    create_report_record,
    get_existing_report,
    get_report_by_id as db_get_report_by_id,
    get_reports as db_get_reports,
    update_report_status as db_update_report_status,
)
from models import Report
from schemas import (
    AnalyticsSummaryOut,
    IssueGroupOut,
    ReportCreate,
    ReportOut,
    ReportResponse,
    StatusUpdate,
)
from services import build_analytics_summary, now_millis, report_to_out, to_issue_groups


Base.metadata.create_all(bind=engine)
ensure_database_schema()

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

VALID_SEVERITIES = [
    "Low",
    "Medium",
    "High",
    "Critical",
]


def ensure_valid_status(status: Optional[str]) -> None:
    if status is not None and status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {VALID_STATUSES}",
        )


def ensure_valid_report_type(report_type: Optional[str]) -> None:
    if report_type is not None and report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Report type must be one of {VALID_REPORT_TYPES}",
        )


def ensure_valid_severity(severity: Optional[str]) -> None:
    if severity is not None and severity not in VALID_SEVERITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Severity must be one of {VALID_SEVERITIES}",
        )


@app.post("/upload-screenshot")
async def upload_screenshot(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {"url": f"http://10.0.2.2:8000/{file_path}"}


@app.post("/reports", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    ensure_valid_report_type(report.report_type)
    ensure_valid_severity(report.severity)

    report_id = report.report_id or str(uuid4())
    created_at = now_millis()

    existing_report = get_existing_report(db, report_id)

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

    create_report_record(db, db_report)

    return ReportResponse(success=True, report_id=report_id)


@app.get("/reports", response_model=List[ReportOut])
def get_reports(
    api_key: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    report_type: Optional[str] = Query(default=None),
    app_version: Optional[str] = Query(default=None),
    screenshot_only: bool = Query(default=False),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    ensure_valid_status(status)
    ensure_valid_report_type(report_type)
    ensure_valid_severity(severity)

    reports = db_get_reports(
        db,
        api_key=api_key,
        status=status,
        severity=severity,
        report_type=report_type,
        app_version=app_version,
        screenshot_only=screenshot_only,
        search=search,
    )
    return [report_to_out(report) for report in reports]


@app.get("/reports/status/{status}", response_model=List[ReportOut])
def get_reports_by_status(status: str, db: Session = Depends(get_db)):
    ensure_valid_status(status)
    reports = db_get_reports(db, status=status)
    return [report_to_out(report) for report in reports]


@app.get("/reports/type/{report_type}", response_model=List[ReportOut])
def get_reports_by_type(report_type: str, db: Session = Depends(get_db)):
    ensure_valid_report_type(report_type)
    reports = db_get_reports(db, report_type=report_type)
    return [report_to_out(report) for report in reports]


@app.get("/issues/groups", response_model=List[IssueGroupOut])
def get_issue_groups(
    api_key: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    report_type: Optional[str] = Query(default=None),
    app_version: Optional[str] = Query(default=None),
    screenshot_only: bool = Query(default=False),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    ensure_valid_status(status)
    ensure_valid_report_type(report_type)
    ensure_valid_severity(severity)

    reports = db_get_reports(
        db,
        api_key=api_key,
        status=status,
        severity=severity,
        report_type=report_type,
        app_version=app_version,
        screenshot_only=screenshot_only,
        search=search,
    )
    return to_issue_groups([report_to_out(report) for report in reports])


@app.get("/analytics/summary", response_model=AnalyticsSummaryOut)
def get_analytics_summary(
    api_key: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    report_type: Optional[str] = Query(default=None),
    app_version: Optional[str] = Query(default=None),
    screenshot_only: bool = Query(default=False),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    ensure_valid_status(status)
    ensure_valid_report_type(report_type)
    ensure_valid_severity(severity)

    reports = db_get_reports(
        db,
        api_key=api_key,
        status=status,
        severity=severity,
        report_type=report_type,
        app_version=app_version,
        screenshot_only=screenshot_only,
        search=search,
    )
    return build_analytics_summary(reports)


@app.get("/reports/{report_id}", response_model=ReportOut)
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db_get_report_by_id(db, report_id)

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return report_to_out(report)


@app.patch("/reports/{report_id}/status", response_model=ReportOut)
def update_report_status(
    report_id: str,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
):
    ensure_valid_status(status_update.status)

    report = db_get_report_by_id(db, report_id)

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return report_to_out(db_update_report_status(db, report, status_update.status))
