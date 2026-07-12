from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

class SimpleAPI(BaseHTTPRequestHandler):
    
    productos = [
        {"id": 1, "nombre": "Laptop", "precio": 899.99, "descripcion": "Laptop gaming"},
        {"id": 2, "nombre": "Mouse", "precio": 29.99, "descripcion": "Mouse inalámbrico"}
    ]

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
                producto = next((p for p in self.productos if p["id"] == pid), None)
                self.send_json(producto if producto else {"error": "No encontrado"})
            except:
                self.send_error(400, "ID inválido")
        else:
            self.send_error(404, "Página no encontrada")

    # ==================== POST ====================
    def do_POST(self):
        if self.path == "/productos":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length).decode('utf-8')
                
                # Si vienen como form (application/x-www-form-urlencoded)
                if self.headers.get('Content-Type') == 'application/x-www-form-urlencoded':
                    params = parse_qs(post_data)
                    nuevo = {
                        "nombre": params.get('nombre', [''])[0],
                        "precio": float(params.get('precio', ['0'])[0]),
                        "descripcion": params.get('descripcion', [''])[0]
                    }
                else:
                    # Si vienen como JSON
                    nuevo = json.loads(post_data)

                nuevo["id"] = len(self.productos) + 1
                self.productos.append(nuevo)

                # Redirigir a la página principal después de crear
                self.send_response(302)
                self.send_header('Location', '/')
                self.end_headers()
            except:
                self.send_error(400, "Error al procesar el formulario")
        else:
            self.send_error(404)

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
            </style>
        </head>
        <body>
            <h1>Gestión de Productos</h1>
            
            <h2>Crear Nuevo Producto</h2>
            <form action="/productos" method="POST">
                <label>Nombre:</label><br>
                <input type="text" name="nombre" required><br><br>
                
                <label>Precio:</label><br>
                <input type="number" name="precio" step="0.01" required><br><br>
                
                <label>Descripción:</label><br>
                <textarea name="descripcion" rows="3" cols="40"></textarea><br><br>
                
                <input type="submit" value="Crear Producto">
            </form>

            <h2>Lista de Productos</h2>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Descripción</th>
                </tr>
                {"".join(f"<tr><td>{p['id']}</td><td>{p['nombre']}</td><td>${p['precio']}</td><td>{p.get('descripcion','')}</td></tr>" for p in self.productos)}
            </table>

            <p><a href="/productos">Ver en formato JSON</a></p>
        </body>
        </html>
        """
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

    def send_json(self, data):
        self.send_response(200)
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