# Backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from database import fetch_all, fetch_one, execute
from create_db import create_database, insertar_categorias_iniciales

# Inicializa esquema por si falta algo
create_database()
insertar_categorias_iniciales()

app = FastAPI(title="Gestor de Gastos API")

# Ajustá el puerto del front (Vite suele ser 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Modelos ======
class UsuarioIn(BaseModel):
    nombre: str
    email: str
    password: str

class UsuarioOut(UsuarioIn):
    id: int

class CategoriaIn(BaseModel):
    nombre: str
    tipo: str  # 'ingreso' | 'gasto'

class CategoriaOut(CategoriaIn):
    id: int

class MovimientoIn(BaseModel):
    descripcion: str
    monto: float
    usuario_id: int
    categoria_id: Optional[int] = None  # puede ser null

class MovimientoOut(MovimientoIn):
    id: int
    fecha: str

# ====== Usuarios ======
@app.get("/usuarios", response_model=List[UsuarioOut])
def list_usuarios():
    return fetch_all("SELECT id, nombre, email, password FROM usuarios")

@app.get("/usuarios/{uid}", response_model=UsuarioOut)
def get_usuario(uid: int):
    row = fetch_one("SELECT id, nombre, email, password FROM usuarios WHERE id=?", (uid,))
    if not row: raise HTTPException(404, "Usuario no encontrado")
    return row

@app.post("/usuarios", response_model=UsuarioOut, status_code=201)
def create_usuario(data: UsuarioIn):
    uid = execute(
        "INSERT INTO usuarios(nombre,email,password) VALUES(?,?,?)",
        (data.nombre, data.email, data.password)
    )
    return {"id": uid, **data.dict()}

@app.put("/usuarios/{uid}", response_model=UsuarioOut)
def update_usuario(uid: int, data: UsuarioIn):
    row = fetch_one("SELECT id FROM usuarios WHERE id=?", (uid,))
    if not row: raise HTTPException(404, "Usuario no encontrado")
    execute("UPDATE usuarios SET nombre=?, email=?, password=? WHERE id=?",
            (data.nombre, data.email, data.password, uid))
    return {"id": uid, **data.dict()}

@app.delete("/usuarios/{uid}", status_code=204)
def delete_usuario(uid: int):
    execute("DELETE FROM usuarios WHERE id=?", (uid,))
    return

# ====== Categorias ======
@app.get("/categorias", response_model=List[CategoriaOut])
def list_categorias():
    return fetch_all("SELECT id, nombre, tipo FROM categorias ORDER BY tipo, nombre")

@app.post("/categorias", response_model=CategoriaOut, status_code=201)
def create_categoria(data: CategoriaIn):
    cid = execute("INSERT INTO categorias(nombre,tipo) VALUES(?,?)", (data.nombre, data.tipo))
    return {"id": cid, **data.dict()}

@app.put("/categorias/{cid}", response_model=CategoriaOut)
def update_categoria(cid: int, data: CategoriaIn):
    row = fetch_one("SELECT id FROM categorias WHERE id=?", (cid,))
    if not row: raise HTTPException(404, "Categoría no encontrada")
    execute("UPDATE categorias SET nombre=?, tipo=? WHERE id=?", (data.nombre, data.tipo, cid))
    return {"id": cid, **data.dict()}

@app.delete("/categorias/{cid}", status_code=204)
def delete_categoria(cid: int):
    execute("DELETE FROM categorias WHERE id=?", (cid,))
    return

# ====== Movimientos ======
@app.get("/movimientos", response_model=List[MovimientoOut])
def list_movimientos():
    return fetch_all("""
      SELECT id, descripcion, monto, fecha, usuario_id, categoria_id
      FROM movimientos
      ORDER BY datetime(fecha) DESC, id DESC
    """)

@app.post("/movimientos", response_model=MovimientoOut, status_code=201)
def create_movimiento(data: MovimientoIn):
    mid = execute(
        "INSERT INTO movimientos(descripcion, monto, usuario_id, categoria_id) VALUES(?,?,?,?)",
        (data.descripcion, data.monto, data.usuario_id, data.categoria_id)
    )
    row = fetch_one("SELECT * FROM movimientos WHERE id=?", (mid,))
    return row  # incluye fecha por default

@app.put("/movimientos/{mid}", response_model=MovimientoOut)
def update_movimiento(mid: int, data: MovimientoIn):
    row = fetch_one("SELECT id FROM movimientos WHERE id=?", (mid,))
    if not row: raise HTTPException(404, "Movimiento no encontrado")
    execute(
        "UPDATE movimientos SET descripcion=?, monto=?, usuario_id=?, categoria_id=? WHERE id=?",
        (data.descripcion, data.monto, data.usuario_id, data.categoria_id, mid)
    )
    row = fetch_one("SELECT * FROM movimientos WHERE id=?", (mid,))
    return row

@app.delete("/movimientos/{mid}", status_code=204)
def delete_movimiento(mid: int):
    execute("DELETE FROM movimientos WHERE id=?", (mid,))
    return
