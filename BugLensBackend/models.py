from sqlalchemy import BigInteger, Column, String, Text

from database import Base


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String, primary_key=True, index=True)
    api_key = Column(String, index=True)
    user_id = Column(String)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    device_model = Column(String, index=True)
    manufacturer = Column(String)
    android_version = Column(String)
    app_version = Column(String, index=True)
    screenshot_path = Column(String)
    metadata_json = Column(Text)
    severity = Column(String, default="Medium", index=True)
    report_type = Column(String, default="bug", index=True)
    stack_trace = Column(Text)
    status = Column(String, index=True)
    created_at = Column(BigInteger, index=True)
