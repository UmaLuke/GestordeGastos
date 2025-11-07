import sqlite3
import os

# Ajustá la ruta según tu estructura real:
base_dir = os.path.dirname(__file__)
db_path = os.path.join(base_dir, "..", "BD", "GestordeGastos.db")
db_path = os.path.abspath(db_path)

if not os.path.exists(db_path):
    raise FileNotFoundError(f"No se encontró la base de datos en: {db_path}")


def get_connection():
    """Devuelve la conexión a la base de datos (con row_factory para dict-like rows)."""
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection

def execute_query(query, params=None):
    """Ejecuta INSERT/UPDATE/DELETE. Devuelve lastrowid."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        return cursor.lastrowid
    except sqlite3.Error as e:
        conn.rollback()
        raise
    finally:
        conn.close()

def fetch_query(query, params=None):
    """Ejecuta SELECT y devuelve lista de filas (sqlite3.Row)."""
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
print("📁 Ruta real de la base de datos:", db_path)
