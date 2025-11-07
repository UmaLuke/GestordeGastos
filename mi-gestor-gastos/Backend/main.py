from fastapi import FastAPI
from database import fetch_query

app = FastAPI()

@app.get("/usuarios")
def usuarios():
    rows = fetch_query("SELECT id, nombre, email FROM usuarios")
    return [dict(r) for r in rows]
