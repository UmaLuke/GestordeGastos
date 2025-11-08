import sqlite3
import os

# Ruta absoluta a la base de datos
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # Sube un nivel desde Backend/
DB_PATH = os.path.join(BASE_DIR, "BD", "GestiondeGastos.db")

def get_connection():
    """Devuelve la conexión a la base de datos."""
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"No se encontró la base de datos en: {DB_PATH}")
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def execute_query(query, params=None):
    """Ejecuta INSERT, UPDATE o DELETE."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def fetch_query(query, params=None):
    """Ejecuta SELECT y devuelve los resultados."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.fetchall()
    finally:
        conn.close()
