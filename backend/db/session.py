import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db.base import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jobfit_dev.db")
AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true"

# SQLite fallback connection argument handling
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if AUTO_CREATE_TABLES:
    # Import models to register them on Base.metadata before creating tables
    import backend.models
    Base.metadata.create_all(bind=engine)
