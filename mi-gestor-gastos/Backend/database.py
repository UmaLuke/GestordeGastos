# Backend/database.py
from typing import List, Dict, Any, Optional
import sqlite3
from BD.create_db import DB_PATH

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def fetch_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(query, params)
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def execute(query: str, params: tuple = ()) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(query, params)
    last_id = cur.lastrowid
    conn.commit()
    conn.close()
    return last_id
