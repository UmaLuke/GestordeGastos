import sqlite3

def init_bd():
    conn = sqlite3.connect("database.db")  # usa el mismo nombre que en tu proyecto
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        contrasena TEXT NOT NULL
    )
    """)

    # Agregamos datos de prueba (opcional)
    cursor.execute("INSERT OR IGNORE INTO usuarios (id, nombre, email, contrasena) VALUES (1, 'Lucas', 'lucas@test.com', '1234')")
    
    conn.commit()
    conn.close()
    print("✅ Base de datos inicializada correctamente.")

if __name__ == "__main__":
    init_bd()
