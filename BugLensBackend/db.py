from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Query, Session

from models import Report


def build_report_query(
    db: Session,
    *,
    api_key: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    report_type: Optional[str] = None,
    app_version: Optional[str] = None,
    screenshot_only: bool = False,
    search: Optional[str] = None,
) -> Query:
    query = db.query(Report).order_by(Report.created_at.desc())

    if api_key:
        query = query.filter(Report.api_key == api_key)

    if status:
        query = query.filter(Report.status == status)

    if severity:
        query = query.filter(Report.severity == severity)

    if report_type:
        query = query.filter(Report.report_type == report_type)

    if app_version:
        query = query.filter(Report.app_version == app_version)

    if screenshot_only:
        query = query.filter(Report.screenshot_path.is_not(None))

    if search:
        normalized_search = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Report.title.ilike(normalized_search),
                Report.description.ilike(normalized_search),
                Report.report_id.ilike(normalized_search),
                Report.user_id.ilike(normalized_search),
                Report.device_model.ilike(normalized_search),
                Report.manufacturer.ilike(normalized_search),
                Report.android_version.ilike(normalized_search),
                Report.app_version.ilike(normalized_search),
                Report.stack_trace.ilike(normalized_search),
                Report.metadata_json.ilike(normalized_search),
            )
        )

    return query


def get_existing_report(db: Session, report_id: str) -> Optional[Report]:
    return db.query(Report).filter(Report.report_id == report_id).first()


def get_reports(
    db: Session,
    *,
    api_key: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    report_type: Optional[str] = None,
    app_version: Optional[str] = None,
    screenshot_only: bool = False,
    search: Optional[str] = None,
) -> list[Report]:
    return build_report_query(
        db,
        api_key=api_key,
        status=status,
        severity=severity,
        report_type=report_type,
        app_version=app_version,
        screenshot_only=screenshot_only,
        search=search,
    ).all()


def get_report_by_id(db: Session, report_id: str) -> Optional[Report]:
    return db.query(Report).filter(Report.report_id == report_id).first()


def create_report_record(db: Session, report: Report) -> Report:
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def update_report_status(db: Session, report: Report, status: str) -> Report:
    report.status = status
    db.commit()
    db.refresh(report)
    return report
