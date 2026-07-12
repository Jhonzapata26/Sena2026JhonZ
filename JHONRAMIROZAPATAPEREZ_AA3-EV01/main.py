from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="API Básica de Ejemplo", version="1.0")


# Modelo para recibir datos
class Producto(BaseModel):
    nombre: str
    precio: float
    descripcion: Optional[str] = None


# Lista en memoria (solo para este ejemplo)
productos = [
    {"id": 1, "nombre": "Laptop", "precio": 899.99, "descripcion": "Laptop gaming"},
    {"id": 2, "nombre": "Mouse", "precio": 29.99, "descripcion": "Mouse inalámbrico"}
]


@app.get("/")
def home():
    return {"mensaje": "¡Bienvenido a mi API básica en Python!"}


@app.get("/productos", response_model=List[dict])
def obtener_productos():
    return productos


@app.get("/productos/{producto_id}")
def obtener_producto(producto_id: int):
    for producto in productos:
        if producto["id"] == producto_id:
            return producto
    return {"error": "Producto no encontrado"}


@app.post("/productos")
def crear_producto(producto: Producto):
    nuevo_producto = {
        "id": len(productos) + 1,
        "nombre": producto.nombre,
        "precio": producto.precio,
        "descripcion": producto.descripcion
    }
    productos.append(nuevo_producto)
    return {"mensaje": "Producto creado correctamente", "producto": nuevo_producto}


@app.get("/saludo/{nombre}")
def saludar(nombre: str):
    return {"saludo": f"¡Hola {nombre}!, ¿cómo estás?"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="127.0.0.1",   # Cambia a "0.0.0.0" si quieres acceder desde el móvil
        port=8000,
        reload=True
    )