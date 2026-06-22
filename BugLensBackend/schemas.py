from datetime import datetime
from typing import Optional, Dict

from pydantic import BaseModel


class ReportCreate(BaseModel):
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