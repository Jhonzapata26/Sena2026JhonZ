from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

# Instancia principal de la aplicación FastAPI
app = FastAPI(title="API Básica de Ejemplo", version="1.0")


# Modelo para recibir datos (se usa al crear o actualizar productos)
class Producto(BaseModel):
    nombre: str
    precio: float
    descripcion: Optional[str] = None


# Lista en memoria (solo para este ejemplo, en un caso real esto sería una base de datos)
productos = [
    {"id": 1, "nombre": "Laptop", "precio": 899.99, "descripcion": "Laptop gaming"},
    {"id": 2, "nombre": "Mouse", "precio": 29.99, "descripcion": "Mouse inalámbrico"}
]

# Contador para asignar el próximo id disponible.
# Se calcula a partir del id más alto existente para evitar duplicados
# si en algún momento se elimina un producto.
siguiente_id = max((p["id"] for p in productos), default=0) + 1


@app.get("/")
def home():
    return {"mensaje": "¡Bienvenido a mi API básica en Python!"}


# READ (listar todos los productos)
@app.get("/productos", response_model=List[dict])
def obtener_productos():
    return productos


# READ (obtener un solo producto por su id)
@app.get("/productos/{producto_id}")
def obtener_producto(producto_id: int):
    for producto in productos:
        if producto["id"] == producto_id:
            return producto
    # Si no se encuentra, se responde con un 404 real en vez de un 200 con "error"
    raise HTTPException(status_code=404, detail="Producto no encontrado")


# CREATE (agregar un nuevo producto)
@app.post("/productos")
def crear_producto(producto: Producto):
    global siguiente_id
    nuevo_producto = {
        "id": siguiente_id,
        "nombre": producto.nombre,
        "precio": producto.precio,
        "descripcion": producto.descripcion
    }
    productos.append(nuevo_producto)
    siguiente_id += 1
    return {"mensaje": "Producto creado correctamente", "producto": nuevo_producto}


# UPDATE (modificar un producto existente por su id)
@app.put("/productos/{producto_id}")
def actualizar_producto(producto_id: int, producto: Producto):
    for p in productos:
        if p["id"] == producto_id:
            # Se actualizan los campos manteniendo el mismo id
            p["nombre"] = producto.nombre
            p["precio"] = producto.precio
            p["descripcion"] = producto.descripcion
            return {"mensaje": "Producto actualizado correctamente", "producto": p}
    raise HTTPException(status_code=404, detail="Producto no encontrado")


# DELETE (eliminar un producto por su id)
@app.delete("/productos/{producto_id}")
def eliminar_producto(producto_id: int):
    for p in productos:
        if p["id"] == producto_id:
            productos.remove(p)
            return {"mensaje": "Producto eliminado correctamente"}
    raise HTTPException(status_code=404, detail="Producto no encontrado")


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