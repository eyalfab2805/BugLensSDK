from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = "sqlite:///./buglens.db"


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def ensure_database_schema() -> None:
    with engine.begin() as connection:
        indexes = [
            "CREATE INDEX IF NOT EXISTS ix_reports_api_key ON reports(api_key)",
            "CREATE INDEX IF NOT EXISTS ix_reports_status ON reports(status)",
            "CREATE INDEX IF NOT EXISTS ix_reports_severity ON reports(severity)",
            "CREATE INDEX IF NOT EXISTS ix_reports_report_type ON reports(report_type)",
            "CREATE INDEX IF NOT EXISTS ix_reports_app_version ON reports(app_version)",
            "CREATE INDEX IF NOT EXISTS ix_reports_device_model ON reports(device_model)",
            "CREATE INDEX IF NOT EXISTS ix_reports_created_at ON reports(created_at)",
        ]

        for statement in indexes:
            connection.execute(text(statement))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
