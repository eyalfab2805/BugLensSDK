from datetime import datetime
from typing import Optional, Dict, List

from pydantic import BaseModel


class ReportCreate(BaseModel):
    report_id: Optional[str] = None
    api_key: str
    user_id: Optional[str] = None
    title: str
    description: str
    device_model: Optional[str] = None
    manufacturer: Optional[str] = None
    android_version: Optional[str] = None
    app_version: Optional[str] = None
    screenshot_path: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None
    severity: str = "Medium"
    report_type: str = "bug"
    stack_trace: Optional[str] = None


class ReportResponse(BaseModel):
    success: bool
    report_id: str


class ReportOut(BaseModel):
    report_id: str
    api_key: str
    user_id: Optional[str] = None
    title: str
    description: str
    device_model: Optional[str] = None
    manufacturer: Optional[str] = None
    android_version: Optional[str] = None
    app_version: Optional[str] = None
    screenshot_path: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None
    severity: str
    report_type: str
    stack_trace: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str


class IssueGroupOut(BaseModel):
    fingerprint: str
    title: str
    report_type: str
    severity: str
    total_reports: int
    unresolved_reports: int
    affected_users: int
    priority_score: int
    latest_seen: Optional[datetime] = None
    app_versions: List[str]
    representative_report_id: str
