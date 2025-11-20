# BD/create_db.py
import sqlite3
import os

# === Configuración de ruta absoluta a la DB ===
BASE_DIR = os.path.dirname(__file__)
DB_NAME = "GestiondeGastos.db"
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, DB_NAME))

def get_conn():
    """Devuelve conexión con foreign_keys activado y WAL mode."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def create_database():
    """Crea/actualiza el esquema de la base de datos."""
    conn = get_conn()
    cur = conn.cursor()

    # Tabla usuarios
    cur.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
    """)

    # Tabla categorias
    cur.execute("""
    CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto', 'egreso'))
    )
    """)

    # Tabla movimientos
    cur.execute("""
    CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        fecha TEXT DEFAULT (datetime('now', 'localtime')),
        usuario_id INTEGER NOT NULL,
        categoria_id INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
    )
    """)

    # Tabla contactos
    cur.execute("""
    CREATE TABLE IF NOT EXISTS contacto (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        fecha TEXT DEFAULT (datetime('now', 'localtime')),
        leido INTEGER DEFAULT 0
    )
    """)

    # Índices recomendados
    cur.execute("CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos(usuario_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_movimientos_categoria ON movimientos(categoria_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_contacto_fecha ON contacto(fecha DESC)")

    conn.commit()
    conn.close()
    print(f"✓ Esquema listo en {DB_PATH}")

def insertar_usuarios(nombre, email, password):
    """Inserta un usuario y retorna su id."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO usuarios (nombre, email, password)
        VALUES (?, ?, ?)
    """, (nombre, email, password))
    uid = cur.lastrowid
    conn.commit()
    conn.close()
    return uid

def insertar_categoria(nombre, tipo):
    """Inserta una categoría y retorna su id."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO categorias (nombre, tipo)
        VALUES (?, ?)
    """, (nombre, tipo))
    cid = cur.lastrowid
    conn.commit()
    conn.close()
    return cid

def insertar_movimiento(descripcion, monto, usuario_id, categoria_id):
    """Inserta un movimiento."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO movimientos (descripcion, monto, usuario_id, categoria_id)
        VALUES (?, ?, ?, ?)
    """, (descripcion, monto, usuario_id, categoria_id))
    conn.commit()
    conn.close()

def insertar_categorias_iniciales():
    """Seed de categorías si aún no existen."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM categorias")
    count = cur.fetchone()[0]
    if count == 0:
        categorias_iniciales = [
            ('Salario', 'ingreso'),
            ('Venta', 'ingreso'),
            ('Cobro de Alquiler', 'ingreso'),
            ('Otros Ingresos', 'ingreso'),
            ('Ingresos', 'ingreso'),
            ('Pago de alquiler', 'gasto'),
            ('Servicios Públicos', 'gasto'),
            ('Supermercado', 'gasto'),
            ('Transporte', 'gasto'),
            ('Gasolina', 'gasto'),
            ('Compras', 'gasto'),
            ('Bares y Restaurantes', 'gasto'),
            ('Vestimenta', 'gasto'),
            ('Entretenimiento', 'gasto'),
            ('Salud', 'gasto'),
            ('Educación', 'gasto'),
            ('Regalos', 'gasto'),
            ('Otros Gastos', 'gasto')
        ]
        cur.executemany("""
            INSERT INTO categorias (nombre, tipo)
            VALUES (?, ?)
        """, categorias_iniciales)
        print("✓ Categorías iniciales insertadas")
    else:
        print("✓ Categorías ya existentes, no se insertan duplicados")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_database()
    insertar_categorias_iniciales()
    print("✓ Base de datos inicializada correctamente")