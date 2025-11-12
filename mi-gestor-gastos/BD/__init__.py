# init_db.py
from create_db import create_database, insertar_usuarios, DB_PATH

if __name__ == "__main__":
    create_database()
    try:
        uid = insertar_usuarios("Lucas", "lucas@test.com", "1234")
        print(f"✅ Usuario de prueba insertado (id={uid}) en {DB_PATH}")
    except Exception as e:
        # Posible UNIQUE constraint (nombre o email ya existentes)
        print(f"ℹ️ No se insertó usuario de prueba (posible duplicado): {e}")
