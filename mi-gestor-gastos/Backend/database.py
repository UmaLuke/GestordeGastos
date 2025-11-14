from typing import List, Dict, Any, Optional
import sqlite3
from BD.create_db import DB_PATH

def get_conn():
    """
    Conexión con timeout aumentado y WAL mode
    """
    conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def fetch_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()

def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def execute(query: str, params: tuple = ()) -> int:
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        last_id = cur.lastrowid
        conn.commit()
        return last_id
    finally:
        conn.close()