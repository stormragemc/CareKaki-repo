"""CareKaki persistence package (Supabase / PostgreSQL via SQLAlchemy).

Activated by setting DATABASE_URL (e.g. the Supabase connection string, or a local
Postgres from docker-compose). When it is unset the whole layer no-ops and the app
falls back to its in-memory hackathon state, so the demo never hard-depends on a DB.
"""

from .session import DB_ENABLED, init_db, get_session
from . import repository

__all__ = ["DB_ENABLED", "init_db", "get_session", "repository"]
