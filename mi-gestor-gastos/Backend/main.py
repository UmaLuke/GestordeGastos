from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import sqlite3
from BD.create_bd import insertar_usuarios, insertar_movimiento, insertar_categoria, insertar_categorias_iniciales

app = FastAPI(
    title="Gestor de Gastos API",
    description="API para gestionar gastos personales",
    version="1.0.0"
)

db_path = "BD/GestiondeGastos.db"


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o limitar a tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Movimiento(BaseModel):
    descripcion: str
    monto: float
    usuario_id: int
    categoria_id: int

class Usuario(BaseModel):
    nombre: str
    email: str
    password: str

class Categoria(BaseModel):
    nombre: str
    tipo: Literal['ingreso', 'gasto']

@app.on_event("startup")
def startup_event():
    insertar_categorias_iniciales()

@app.get("/")
def read_root():
    return JSONResponse(content={"message": "Bienvenido a la API de Gestor de Gastos"})

@app.post("/usuarios/")
def agregar_usuario(usuario: Usuario):
    usuario_id = insertar_usuarios(usuario.nombre, usuario.email, usuario.password)
    return {"usuario_id": usuario_id}

@app.get("/usuarios/")
def listar_usuarios():
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, email FROM usuarios")
        usuarios = [{"id": row[0], "nombre": row[1], "email": row[2]} for row in cursor.fetchall()]
    return {"usuarios": usuarios}

@app.post("/movimientos/")
def agregar_movimiento(movimiento: Movimiento):
    insertar_movimiento(movimiento.descripcion, movimiento.monto, movimiento.usuario_id, movimiento.categoria_id)
    return {"mensaje": "Movimiento agregado exitosamente"}

@app.post("/categorias/")
def agregar_categoria(categoria: Categoria):
    categoria_id = insertar_categoria(categoria.nombre, categoria.tipo)
    return {"categoria_id": categoria_id}

@app.get("/usuarios/{usuario_id}/movimientos/")
def obtener_movimientos_usuario(usuario_id: int):
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion, monto, categoria_id 
            FROM movimientos 
            WHERE usuario_id = ?
        """, (usuario_id,))
        movimientos = [
            {"id": row[0], "descripcion": row[1], "monto": row[2], "categoria_id": row[3]}
            for row in cursor.fetchall()
        ]
    return {"movimientos": movimientos}

@app.post("/categorias/")
def agregar_categoria(categoria: Categoria):
    categoria_id = insertar_categoria(categoria.nombre, categoria.tipo)
    return {"categoria_id": categoria_id}

@app.get("/categorias/")
def listar_categorias():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre, tipo FROM categorias")
    categorias = [{"id": row[0], "nombre": row[1], "tipo": row[2]} for row in cursor.fetchall()]
    conn.close()
    return {"categorias": categorias}

@app.get("/test-bd")
def test_bd():
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tablas = [t[0] for t in cursor.fetchall()]
        return {"status": "ok", "tablas": tablas}
    except Exception as e:
        return {"status": "error", "detalle": str(e)}
