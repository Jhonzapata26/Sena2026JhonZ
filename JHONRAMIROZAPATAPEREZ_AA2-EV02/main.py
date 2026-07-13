from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

class SimpleAPI(BaseHTTPRequestHandler):
    
    productos = [
        {"id": 1, "nombre": "Laptop", "precio": 899.99, "descripcion": "Laptop gaming"},
        {"id": 2, "nombre": "Mouse", "precio": 29.99, "descripcion": "Mouse inalámbrico"}
    ]
    siguiente_id = 3

    # ==================== GET ====================
    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/" or path == "/index.html":
            self.serve_html()
        elif path == "/productos":
            self.send_json(self.productos)
        elif path.startswith("/productos/"):
            try:
                pid = int(path.split("/")[-1])
            except ValueError:
                self.send_json({"error": "ID inválido"}, status=400)
                return
            producto = next((p for p in self.productos if p["id"] == pid), None)
            if producto:
                self.send_json(producto)
            else:
                self.send_json({"error": "No encontrado"}, status=404)
        else:
            self.send_error(404, "Página no encontrada")

    # ==================== POST ====================
    def do_POST(self):
        if self.path == "/productos":
            content_type = self.headers.get('Content-Type', '')
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length).decode('utf-8')

                if content_type == 'application/x-www-form-urlencoded':
                    params = parse_qs(post_data)
                    nuevo = {
                        "nombre": params.get('nombre', [''])[0],
                        "precio": float(params.get('precio', ['0'])[0]),
                        "descripcion": params.get('descripcion', [''])[0]
                    }
                else:
                    nuevo = json.loads(post_data)

                nuevo["id"] = SimpleAPI.siguiente_id
                SimpleAPI.siguiente_id += 1
                self.productos.append(nuevo)

                if content_type == 'application/x-www-form-urlencoded':
                    # Fallback sin JS: redirigir a la página principal
                    self.send_response(302)
                    self.send_header('Location', '/')
                    self.end_headers()
                else:
                    self.send_json(nuevo, status=201)
            except (ValueError, json.JSONDecodeError):
                self.send_json({"error": "Error al procesar el formulario"}, status=400)
        else:
            self.send_error(404)

    # ==================== PUT ====================
    def do_PUT(self):
        path = urlparse(self.path).path
        if not path.startswith("/productos/"):
            self.send_error(404)
            return
        try:
            pid = int(path.split("/")[-1])
        except ValueError:
            self.send_json({"error": "ID inválido"}, status=400)
            return

        producto = next((p for p in self.productos if p["id"] == pid), None)
        if not producto:
            self.send_json({"error": "No encontrado"}, status=404)
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            cambios = json.loads(body)
        except (ValueError, json.JSONDecodeError):
            self.send_json({"error": "JSON inválido"}, status=400)
            return

        for campo in ("nombre", "precio", "descripcion"):
            if campo in cambios:
                producto[campo] = cambios[campo]

        self.send_json(producto)

    # ==================== DELETE ====================
    def do_DELETE(self):
        path = urlparse(self.path).path
        if not path.startswith("/productos/"):
            self.send_error(404)
            return
        try:
            pid = int(path.split("/")[-1])
        except ValueError:
            self.send_json({"error": "ID inválido"}, status=400)
            return

        producto = next((p for p in self.productos if p["id"] == pid), None)
        if not producto:
            self.send_json({"error": "No encontrado"}, status=404)
            return

        self.productos.remove(producto)
        self.send_json({"mensaje": "Producto eliminado", "id": pid})

    # ==================== MÉTODOS AUXILIARES ====================
    def serve_html(self):
        html = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Mi API con Formularios</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                form {{ margin: 20px 0; padding: 20px; border: 1px solid #ccc; }}
                button {{ cursor: pointer; }}
            </style>
        </head>
        <body>
            <h1>Gestión de Productos</h1>

            <h2 id="form-titulo">Crear Nuevo Producto</h2>
            <form id="productoForm">
                <input type="hidden" id="productoId" value="">

                <label>Nombre:</label><br>
                <input type="text" id="nombre" required><br><br>

                <label>Precio:</label><br>
                <input type="number" id="precio" step="0.01" required><br><br>

                <label>Descripción:</label><br>
                <textarea id="descripcion" rows="3" cols="40"></textarea><br><br>

                <button type="submit" id="submitBtn">Crear Producto</button>
                <button type="button" id="cancelBtn" style="display:none" onclick="cancelarEdicion()">Cancelar</button>
            </form>

            <h2>Lista de Productos</h2>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                </tr>
                {"".join(f'''<tr>
                    <td>{p["id"]}</td>
                    <td>{p["nombre"]}</td>
                    <td>${p["precio"]}</td>
                    <td>{p.get("descripcion", "")}</td>
                    <td>
                        <button type="button" onclick='editarProducto({json.dumps(p, ensure_ascii=False)})'>Editar</button>
                        <button type="button" onclick="eliminarProducto({p['id']})">Eliminar</button>
                    </td>
                </tr>''' for p in self.productos)}
            </table>

            <p><a href="/productos">Ver en formato JSON</a></p>

            <script>
                const form = document.getElementById('productoForm');

                form.addEventListener('submit', async (e) => {{
                    e.preventDefault();
                    const id = document.getElementById('productoId').value;
                    const datos = {{
                        nombre: document.getElementById('nombre').value,
                        precio: parseFloat(document.getElementById('precio').value),
                        descripcion: document.getElementById('descripcion').value
                    }};

                    const url = id ? `/productos/${{id}}` : '/productos';
                    const metodo = id ? 'PUT' : 'POST';

                    const resp = await fetch(url, {{
                        method: metodo,
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify(datos)
                    }});

                    if (resp.ok) {{
                        location.reload();
                    }} else {{
                        alert('Error al guardar el producto');
                    }}
                }});

                function editarProducto(producto) {{
                    document.getElementById('productoId').value = producto.id;
                    document.getElementById('nombre').value = producto.nombre;
                    document.getElementById('precio').value = producto.precio;
                    document.getElementById('descripcion').value = producto.descripcion || '';
                    document.getElementById('form-titulo').innerText = 'Editar Producto';
                    document.getElementById('submitBtn').innerText = 'Actualizar Producto';
                    document.getElementById('cancelBtn').style.display = 'inline';
                    window.scrollTo(0, 0);
                }}

                function cancelarEdicion() {{
                    form.reset();
                    document.getElementById('productoId').value = '';
                    document.getElementById('form-titulo').innerText = 'Crear Nuevo Producto';
                    document.getElementById('submitBtn').innerText = 'Crear Producto';
                    document.getElementById('cancelBtn').style.display = 'none';
                }}

                async function eliminarProducto(id) {{
                    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
                    const resp = await fetch(`/productos/${{id}}`, {{ method: 'DELETE' }});
                    if (resp.ok) {{
                        location.reload();
                    }} else {{
                        alert('Error al eliminar el producto');
                    }}
                }}
            </script>
        </body>
        </html>
        """
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))


# ==================== INICIAR SERVIDOR ====================
if __name__ == "__main__":
    server_address = ('127.0.0.1', 8000)
    httpd = HTTPServer(server_address, SimpleAPI)
    print("🚀 Servidor corriendo en → http://127.0.0.1:8000")
    print("Presiona Ctrl + C para detener")
    httpd.serve_forever()