import sqlite3
import os


base_dir = os.path.dirname(__file__)
db_path = os.path.join(base_dir,"GestiondeGastos.db")
db_path = os.path.abspath(db_path)

conn= sqlite3.connect(db_path)
cursor= conn.cursor()

def create_database(db_name):
        """Inicializar base de datos"""
        conn = sqlite3.connect('GestiondeGastos.db')
        cursor = conn.cursor()

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios 
                       (id INTEGER PRIMARY KEY AUTOINCREMENT,
                       nombre TEXT NOT NULL UNIQUE,
                       email TEXT NOT NULL UNIQUE,
                       password TEXT NOT NULL 
                       )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS movimientos 
                       (id INTEGER PRIMARY KEY AUTOINCREMENT,
                       descripcion TEXT NOT NULL,
                       monto REAL NOT NULL,
                       fecha TEXT DEFAULT (datetime('now', 'localtime')),
                       usuario_id INTEGER NOT NULL,
                       categoria_id INTEGER NOT NULL,
                       FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                       FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
                       )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS categorias 
                       (id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nombre TEXT NOT NULL UNIQUE,
                        tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'gasto'))
                       )''')
                                 

        conn.commit()
        conn.close()
        print("✓ Base de datos 'GestiondeGastos.db' inicializada exitosamente")   


#Insertamos datos

def insertar_usuarios (nombre, email, password):
    """Inserta un usuario en la base de datos"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO usuarios (nombre, email, password)
        VALUES (?, ?, ?)
    ''', (nombre, email, password))
    
    usuario_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return usuario_id

def insertar_movimiento(descripcion, monto, usuario_id, categoria_id):
    """Inserta un movimiento en la base de datos"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO movimientos (descripcion, monto, usuario_id, categoria_id)
        VALUES (?, ?, ?, ?)
    ''', (descripcion, monto, usuario_id, categoria_id))
    
    conn.commit()
    conn.close()

def insertar_categoria(nombre, tipo):
    """Inserta una categoría en la base de datos"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO categorias (nombre, tipo)
        VALUES (?, ?)
    ''', (nombre, tipo))
    categoria_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return categoria_id

def insertar_categorias_iniciales():
    """Inserta categorías iniciales en la base de datos si no existen"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM categorias")
    count = cursor.fetchone()[0]
    if count == 0:
        categorias_iniciales = [
            ('Salario', 'ingreso'),
            ('Venta', 'ingreso'),
            ('Pago de alquiler', 'gasto'),
            ('Cobro de Alquiler', 'ingreso'),
            ('Servicios Públicos', 'gasto'),
            ('Supermercado', 'gasto'),
            ('Transporte', 'gasto'),
            ('Gasolina', 'gasto'),
            ('Compras', 'gasto'),
            ('Bares y Restaurantes', 'gasto'),
            ('Vestimenta', 'gasto'),
            ('Entertenimiento', 'gasto'),
            ('Salud', 'gasto'),
            ('Educación', 'gasto'),
            ('Regalos', 'gasto'),
            ('Otros Ingresos', 'ingreso'),
            ('Otros Gastos', 'gasto')
        ]

        cursor.executemany('''
            INSERT INTO categorias (nombre, tipo)
            VALUES (?, ?)
        ''', categorias_iniciales)
        print("✓ Categorías iniciales insertadas correctamente")
    else:
        print("✓ Las categorías iniciales ya existen en la base de datos")
        
    conn.commit()
    conn.close()
    print("Base de datos iniciada correctamente")

if __name__ == "__main__":
    create_database('GestiondeGastos.db')
    insertar_categorias_iniciales()