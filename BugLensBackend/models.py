from sqlalchemy import Column, String, BigInteger, Text
from database import Base


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String, primary_key=True, index=True)
    api_key = Column(String)
    user_id = Column(String)
    title = Column(String)
    description = Column(String)
    device_model = Column(String)
    manufacturer = Column(String)
    android_version = Column(String)
    app_version = Column(String)
    screenshot_path = Column(String)
    metadata_json = Column(Text)
    severity = Column(String, default="Medium")
    report_type = Column(String, default="bug")
    stack_trace = Column(Text)
    status = Column(String)
    created_at = Column(BigInteger)