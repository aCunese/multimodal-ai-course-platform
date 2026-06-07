from __future__ import annotations

import os
import sqlite3
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]


def get_runtime_path(default_name: str, *, env_var: str | None = None) -> Path:
    configured_path = os.getenv(env_var) if env_var else None
    if configured_path:
        return Path(configured_path)
    return BACKEND_ROOT / "var" / default_name


def get_db_path() -> Path:
    return get_runtime_path("history.db", env_var="MULTIMODAL_APP_DB_PATH")


def get_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, timeout=30)
    connection.row_factory = sqlite3.Row
    return connection
