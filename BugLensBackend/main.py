from typing import List
from uuid import uuid4
from datetime import datetime
from fastapi.staticfiles import StaticFiles
import os
import json

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi import UploadFile, File

from database import Base, engine, get_db
from models import Report
from schemas import ReportCreate, ReportResponse, ReportOut, StatusUpdate


Base.metadata.create_all(bind=engine)

app = FastAPI(title="BugLens API")


os.makedirs("uploads", exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

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


@app.post("/upload-screenshot")
async def upload_screenshot(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {
        "url": f"http://10.0.2.2:8000/{file_path}"
    }


@app.post("/reports", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    print("Incoming report id:", report.report_id)
    print("Incoming severity:", report.severity)

    if report.report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Report type must be one of {VALID_REPORT_TYPES}",
        )

    report_id = report.report_id or str(uuid4())
    created_at = int(datetime.now().timestamp() * 1000)

    existing_report = db.query(Report).filter(Report.report_id == report_id).first()

    if existing_report is not None:
        return ReportResponse(
            success=True,
            report_id=existing_report.report_id,
        )

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

    return ReportResponse(
        success=True,
        report_id=report_id,
    )


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


@app.get("/reports/{report_id}", response_model=ReportOut)
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.report_id == report_id).first()

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    return report_to_out(report)


@app.patch("/reports/{report_id}/status", response_model=ReportOut)
def update_report_status(
    report_id: str,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.report_id == report_id).first()

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    if status_update.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {VALID_STATUSES}",
        )

    report.status = status_update.status

    db.commit()
    db.refresh(report)

    return report_to_out(report)