"""Engine + session management.

DATABASE_URL examples:
  Supabase   postgresql+psycopg://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres
  Local pg   postgresql+psycopg://carekaki:carekaki@localhost:5432/carekaki
  Test       sqlite:///./carekaki.db   (ORM is dialect-agnostic; Postgres is the target)
"""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DB_ENABLED = bool(DATABASE_URL)

Base = declarative_base()

_engine = None
_SessionLocal = None

if DB_ENABLED:
    # pool_pre_ping avoids stale-connection errors against Supabase's pooler.
    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    _engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
    _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    """Create tables if the DB is configured. Safe to call on every startup."""
    if not DB_ENABLED:
        return
    # Import models so they register on Base.metadata before create_all.
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=_engine)


@contextmanager
def get_session():
    """Transactional scope. Yields None when the DB is disabled so callers can
    treat persistence as best-effort and keep serving from in-memory state."""
    if not DB_ENABLED:
        yield None
        return
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
