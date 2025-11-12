# Backend/seed_db.py
from create_db import create_database, insertar_categorias_iniciales, insertar_usuarios, insertar_movimiento
from database import fetch_all

create_database()
insertar_categorias_iniciales()

# 10 usuarios
uids = []
for i in range(1, 11):
    uids.append(insertar_usuarios(f"Usuario{i}", f"user{i}@test.com", "1234"))

# Tomo una categoría válida (por ejemplo la primera)
cats = fetch_all("SELECT id FROM categorias LIMIT 1")
cat_id = cats[0]["id"] if cats else None

# 10 movimientos
for i in range(1, 11):
    insertar_movimiento(f"Movimiento {i}", 1000 + i, uids[i % len(uids)], cat_id)

