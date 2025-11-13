# Backend/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
# Nuevos imports para seguridad
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta, timezone # Importar datetime y timedelta
import jwt # Importar jwt (de la librería python-jose)
from passlib.context import CryptContext # Importar passlib

# Importar funciones de la BD
from .database import fetch_all, fetch_one, execute
from BD.create_db import create_database, insertar_categorias_iniciales

# --- Configuración de Seguridad (Hashing y JWT) ---

# 1. Configuración de Hashing (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Configuración de JWT
SECRET_KEY = "tu_clave_secreta_muy_larga_y_dificil_de_adivinar" # ¡CAMBIA ESTO!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # 1 hora (puedes cambiarlo)

# 3. Esquema de OAuth2 (le dice a FastAPI cómo "leer" el token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Funciones Auxiliares de Seguridad ---

def verify_password(plain_password, hashed_password):
    """Verifica una contraseña plana contra un hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Genera un hash de una contraseña."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un nuevo token JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Por defecto, 15 minutos si no se especifica
        expire = datetime.now(timezone.utc) + timedelta(minutes=15) 
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Inicialización de la App ---
create_database()
insertar_categorias_iniciales()

app = FastAPI(title="Gestor de Gastos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Modelos (Schemas) ======

class UsuarioIn(BaseModel):
    nombre: str
    email: str
    password: str

class UsuarioOut(BaseModel): # Modificado: No debe devolver NUNCA la contraseña
    id: int
    nombre: str
    email: str

class CategoriaIn(BaseModel):
    nombre: str
    tipo: str  # 'ingreso' | 'gasto'

class CategoriaOut(CategoriaIn):
    id: int

# --- Modelos de Movimientos (Actualizados) ---
class MovimientoBase(BaseModel):
    """Modelo base para un movimiento, sin IDs."""
    descripcion: str
    monto: float
    categoria_id: Optional[int] = None

class MovimientoIn(MovimientoBase):
    """Lo que el usuario envía al crear/actualizar. No necesita usuario_id."""
    pass 

class MovimientoOut(MovimientoBase):
    """Lo que la API devuelve. Incluye IDs y fecha."""
    id: int
    fecha: str
    usuario_id: int

# --- Modelos de Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# ====== Autenticación y Usuarios ======

# Función para obtener el usuario actual desde el token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Decodifica el token, encuentra al usuario y lo devuelve."""
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
    
    # Devuelve el usuario como un diccionario
    user = fetch_one("SELECT id, nombre, email FROM usuarios WHERE email = ?", (token_data.email,))
    if user is None:
        raise credentials_exception
    return user

# Endpoint de Login (reemplaza al tuyo)
# Usa OAuth2PasswordRequestForm para recibir "username" y "password"
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # 1. Busca al usuario por email (que viene en form_data.username)
    user = fetch_one(
        "SELECT id, nombre, email, password FROM usuarios WHERE email = ?",
        (form_data.username,)
    )
    
    # 2. Verifica si el usuario existe Y si la contraseña es correcta
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Crea el token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    # 4. Devuelve el token
    return {"access_token": access_token, "token_type": "bearer"}


# Endpoint de Registro (Modificado para hashear la contraseña)
@app.post("/usuarios", response_model=UsuarioOut, status_code=201)
def create_usuario(data: UsuarioIn):
    # Hashea la contraseña antes de guardarla
    hashed_password = get_password_hash(data.password)
    
    try:
        uid = execute(
            "INSERT INTO usuarios(nombre, email, password) VALUES(?, ?, ?)",
            (data.nombre, data.email, hashed_password) # Guarda el hash, no la contraseña
        )
        return {"id": uid, "nombre": data.nombre, "email": data.email}
    except Exception as e:
        # Manejo básico de error si el email o nombre ya existen
        raise HTTPException(status_code=400, detail=f"No se pudo crear el usuario. ¿Email o nombre ya existen?")

# Endpoint de prueba para verificar que el token funciona
@app.get("/usuarios/me", response_model=UsuarioOut)
async def read_users_me(current_user: UsuarioOut = Depends(get_current_user)):
    # Si llegas aquí, el token es válido.
    # 'current_user' es el usuario (dict) obtenido desde el token.
    return current_user

# ====== Categorias (AHORA PROTEGIDAS) ======

@app.get("/categorias", response_model=List[CategoriaOut])
def list_categorias(current_user: UsuarioOut = Depends(get_current_user)):
    # Solo usuarios logueados pueden ver las categorías
    return fetch_all("SELECT id, nombre, tipo FROM categorias ORDER BY tipo, nombre")

@app.post("/categorias", response_model=CategoriaOut, status_code=201)
def create_categoria(data: CategoriaIn, current_user: UsuarioOut = Depends(get_current_user)):
    # Solo usuarios logueados pueden crear categorías
    try:
        cid = execute("INSERT INTO categorias(nombre,tipo) VALUES(?,?)", (data.nombre, data.tipo))
        return {"id": cid, **data.dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo crear la categoría: {e}")

@app.put("/categorias/{cid}", response_model=CategoriaOut)
def update_categoria(cid: int, data: CategoriaIn, current_user: UsuarioOut = Depends(get_current_user)):
    # Solo usuarios logueados pueden editar categorías
    row = fetch_one("SELECT id FROM categorias WHERE id=?", (cid,))
    if not row: raise HTTPException(404, "Categoría no encontrada")
    execute("UPDATE categorias SET nombre=?, tipo=? WHERE id=?", (data.nombre, data.tipo, cid))
    return {"id": cid, **data.dict()}

@app.delete("/categorias/{cid}", status_code=204)
def delete_categoria(cid: int, current_user: UsuarioOut = Depends(get_current_user)):
    # Solo usuarios logueados pueden borrar categorías
    row = fetch_one("SELECT id FROM categorias WHERE id=?", (cid,))
    if not row: raise HTTPException(404, "Categoría no encontrada")
    execute("DELETE FROM categorias WHERE id=?", (cid,))
    return

# ====== Movimientos (AHORA PROTEGIDOS Y LIGADOS AL USUARIO) ======

@app.get("/movimientos", response_model=List[MovimientoOut])
def list_movimientos(current_user: UsuarioOut = Depends(get_current_user)):
    """Obtiene solo los movimientos del usuario actual."""
    user_id = current_user["id"]
    return fetch_all("""
      SELECT id, descripcion, monto, fecha, usuario_id, categoria_id
      FROM movimientos
      WHERE usuario_id = ? 
      ORDER BY datetime(fecha) DESC, id DESC
    """, (user_id,))

@app.post("/movimientos", response_model=MovimientoOut, status_code=201)
def create_movimiento(data: MovimientoIn, current_user: UsuarioOut = Depends(get_current_user)):
    """Crea un nuevo movimiento asignado al usuario actual."""
    user_id = current_user["id"]
    mid = execute(
        "INSERT INTO movimientos(descripcion, monto, usuario_id, categoria_id) VALUES(?,?,?,?)",
        (data.descripcion, data.monto, user_id, data.categoria_id)
    )
    row = fetch_one("SELECT * FROM movimientos WHERE id=?", (mid,))
    return row

@app.put("/movimientos/{mid}", response_model=MovimientoOut)
def update_movimiento(mid: int, data: MovimientoIn, current_user: UsuarioOut = Depends(get_current_user)):
    """Actualiza un movimiento, verificando que pertenezca al usuario actual."""
    user_id = current_user["id"]
    
    # 1. Verificar que el movimiento existe
    mov = fetch_one("SELECT id, usuario_id FROM movimientos WHERE id=?", (mid,))
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    # 2. Verificar que el movimiento pertenece al usuario
    if mov["usuario_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tiene permiso para editar este movimiento")

    # 3. Si todo está bien, actualizar
    execute(
        "UPDATE movimientos SET descripcion=?, monto=?, categoria_id=? WHERE id=?",
        (data.descripcion, data.monto, data.categoria_id, mid)
    )
    row = fetch_one("SELECT * FROM movimientos WHERE id=?", (mid,))
    return row

@app.delete("/movimientos/{mid}", status_code=204)
def delete_movimiento(mid: int, current_user: UsuarioOut = Depends(get_current_user)):
    """Elimina un movimiento, verificando que pertenezca al usuario actual."""
    user_id = current_user["id"]
    
    # 1. Verificar que el movimiento existe
    mov = fetch_one("SELECT id, usuario_id FROM movimientos WHERE id=?", (mid,))
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    # 2. Verificar que el movimiento pertenece al usuario
    if mov["usuario_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tiene permiso para borrar este movimiento")

    # 3. Si todo está bien, eliminar
    execute("DELETE FROM movimientos WHERE id=?", (mid,))
    return