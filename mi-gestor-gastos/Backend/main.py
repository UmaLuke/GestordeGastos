# Backend/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext

from .database import fetch_all, fetch_one, execute
from BD.create_db import create_database, insertar_categorias_iniciales

# --- Configuración de Seguridad ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "tu_clave_secreta_muy_larga_y_dificil_de_adivinar"  # ¡CAMBIA ESTO EN PRODUCCIÓN!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Funciones de Seguridad (CORREGIDAS) ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña plana contra un hash."""
    # passlib maneja la codificación internamente
    return pwd_context.verify(plain_password[:72], hashed_password)

def get_password_hash(password: str) -> str:
    """Genera un hash de una contraseña."""
    # passlib maneja la codificación internamente
    return pwd_context.hash(password[:72])

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un nuevo token JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Inicialización ---
create_database()
insertar_categorias_iniciales()

app = FastAPI(title="Gestor de Gastos API")

# ⚠️ CORS debe ir ANTES de las rutas
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Modelos (Schemas) ======
class UsuarioIn(BaseModel):
    nombre: str
    email: str
    password: str

class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str

class CategoriaIn(BaseModel):
    nombre: str
    tipo: str

class CategoriaOut(CategoriaIn):
    id: int

class MovimientoBase(BaseModel):
    descripcion: str
    monto: float
    categoria_id: Optional[int] = None

class MovimientoIn(MovimientoBase):
    pass

class MovimientoOut(MovimientoBase):
    id: int
    fecha: str
    usuario_id: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ====== Autenticación ======
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Decodifica el token y devuelve el usuario."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception

    user = fetch_one("SELECT id, nombre, email FROM usuarios WHERE email = ?", (token_data.email,))
    if user is None:
        raise credentials_exception
    return user

# ====== Endpoints ======

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Endpoint de login que devuelve un token JWT."""
    user = fetch_one(
        "SELECT id, nombre, email, password FROM usuarios WHERE email = ?",
        (form_data.username,)
    )

    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/usuarios", response_model=UsuarioOut, status_code=201)
def create_usuario(data: UsuarioIn):
    """Registra un nuevo usuario."""
    # Verificar si el email ya existe
    existing = fetch_one("SELECT id FROM usuarios WHERE email = ?", (data.email,))
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Este email ya está registrado"
        )
    
    hashed_password = get_password_hash(data.password)

    try:
        uid = execute(
            "INSERT INTO usuarios(nombre, email, password) VALUES(?, ?, ?)",
            (data.nombre, data.email, hashed_password)
        )
        return {"id": uid, "nombre": data.nombre, "email": data.email}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear usuario: {str(e)}")

@app.get("/usuarios/me", response_model=UsuarioOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Devuelve los datos del usuario actual."""
    return current_user

# ====== Categorías (Protegidas) ======
@app.get("/categorias", response_model=List[CategoriaOut])
def list_categorias(current_user: dict = Depends(get_current_user)):
    return fetch_all("SELECT id, nombre, tipo FROM categorias ORDER BY tipo, nombre")

@app.post("/categorias", response_model=CategoriaOut, status_code=201)
def create_categoria(data: CategoriaIn, current_user: dict = Depends(get_current_user)):
    try:
        cid = execute("INSERT INTO categorias(nombre,tipo) VALUES(?,?)", (data.nombre, data.tipo))
        return {"id": cid, **data.dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear categoría: {e}")

@app.put("/categorias/{cid}", response_model=CategoriaOut)
def update_categoria(cid: int, data: CategoriaIn, current_user: dict = Depends(get_current_user)):
    row = fetch_one("SELECT id FROM categorias WHERE id=?", (cid,))
    if not row:
        raise HTTPException(404, "Categoría no encontrada")
    execute("UPDATE categorias SET nombre=?, tipo=? WHERE id=?", (data.nombre, data.tipo, cid))
    return {"id": cid, **data.dict()}

@app.delete("/categorias/{cid}", status_code=204)
def delete_categoria(cid: int, current_user: dict = Depends(get_current_user)):
    row = fetch_one("SELECT id FROM categorias WHERE id=?", (cid,))
    if not row:
        raise HTTPException(404, "Categoría no encontrada")
    execute("DELETE FROM categorias WHERE id=?", (cid,))
    return

# ====== Movimientos (Protegidos) ======
@app.get("/movimientos", response_model=List[MovimientoOut])
def list_movimientos(current_user: dict = Depends(get_current_user)):
    """Obtiene solo los movimientos del usuario actual."""
    user_id = current_user["id"]
    return fetch_all("""
      SELECT id, descripcion, monto, fecha, usuario_id, categoria_id
      FROM movimientos
      WHERE usuario_id = ? 
      ORDER BY datetime(fecha) DESC, id DESC
    """, (user_id,))

@app.post("/movimientos", response_model=MovimientoOut, status_code=201)
def create_movimiento(data: MovimientoIn, current_user: dict = Depends(get_current_user)):
    """Crea un nuevo movimiento asignado al usuario actual."""
    user_id = current_user["id"]
    mid = execute(
        "INSERT INTO movimientos(descripcion, monto, usuario_id, categoria_id) VALUES(?,?,?,?)",
        (data.descripcion, data.monto, user_id, data.categoria_id)
    )
    row = fetch_one("SELECT * FROM movimientos WHERE id=?", (mid,))
    return row

@app.put("/movimientos/{mid}", response_model=MovimientoOut)
def update_movimiento(mid: int, data: MovimientoIn, current_user: dict = Depends(get_current_user)):
    """Actualiza un movimiento del usuario actual."""
    user_id = current_user["id"]
    mov = fetch_one("SELECT id, usuario_id FROM movimientos WHERE id=?", (mid,))
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    if mov["usuario_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este movimiento")

    execute(
        "UPDATE movimientos SET descripcion=?, monto=?, categoria_id=? WHERE id=?",
        (data.descripcion, data.monto, data.categoria_id, mid)
    )
    row = fetch_one("SELECT * FROM movimientos WHERE id=?", (mid,))
    return row

@app.delete("/movimientos/{mid}", status_code=204)
def delete_movimiento(mid: int, current_user: dict = Depends(get_current_user)):
    """Elimina un movimiento del usuario actual."""
    user_id = current_user["id"]
    mov = fetch_one("SELECT id, usuario_id FROM movimientos WHERE id=?", (mid,))
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    if mov["usuario_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para borrar este movimiento")

    execute("DELETE FROM movimientos WHERE id=?", (mid,))
    return