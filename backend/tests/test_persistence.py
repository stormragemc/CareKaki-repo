"""Persistence-layer tests.

The DB modules read DATABASE_URL at import time, so we point it at a temp SQLite
file and import the package fresh inside the test. SQLite exercises the exact same
dialect-agnostic ORM code that runs against Supabase Postgres in production.
"""

import importlib
import sys

import pytest


@pytest.fixture()
def repo(tmp_path, monkeypatch):
    db_file = tmp_path / "carekaki_test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")
    # Drop any already-imported db.* modules so they re-read DATABASE_URL.
    for mod in [m for m in sys.modules if m == "db" or m.startswith("db.")]:
        del sys.modules[mod]
    db = importlib.import_module("db")
    db.init_db()
    yield db.repository
    for mod in [m for m in sys.modules if m == "db" or m.startswith("db.")]:
        del sys.modules[mod]


def test_profile_upsert_accretes_fields(repo):
    repo.upsert_profile("senior-a", {"name": "Mdm Tan", "age": 78, "living": "alone"})
    repo.upsert_profile("senior-a", {"mobility": "walker", "conditions": "diabetes"})
    p = repo.get_profile("senior-a")
    assert p["name"] == "Mdm Tan"
    assert p["age"] == 78
    assert p["fields"]["living"] == "alone"
    assert p["fields"]["mobility"] == "walker"
    assert p["fields"]["conditions"] == "diabetes"


def test_upsert_ignores_empty_values(repo):
    repo.upsert_profile("senior-b", {"name": "Ah Kong", "age": 80})
    repo.upsert_profile("senior-b", {"name": "", "conditions": None, "notes": []})
    p = repo.get_profile("senior-b")
    assert p["name"] == "Ah Kong"  # not overwritten by empty string
    assert "conditions" not in p["fields"]
    assert "notes" not in p["fields"]


def test_case_lifecycle_and_timeline(repo):
    repo.create_case("CK-1", "Mdm Tan", 78, "Fall at home", "High")
    repo.add_event("CK-1", "system", "Case packet assembled", "success")
    repo.set_case_status("CK-1", "in_progress")
    repo.add_event("CK-1", "user", "Coordinator accepted", "success")

    cases = repo.list_cases()
    assert len(cases) == 1
    case = cases[0]
    assert case["case_ref"] == "CK-1"
    assert case["status"] == "in_progress"
    assert [e["text"] for e in case["events"]] == ["Case packet assembled", "Coordinator accepted"]


def test_list_cases_orders_newest_first(repo):
    repo.create_case("CK-1", "A", 70, "issue a")
    repo.create_case("CK-2", "B", 71, "issue b")
    refs = [c["case_ref"] for c in repo.list_cases()]
    assert refs[0] == "CK-2"
