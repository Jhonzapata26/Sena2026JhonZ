import os

import mysql.connector
from dotenv import load_dotenv

load_dotenv()


class ConexionBD:
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.usuario = os.getenv("DB_USER")
        self.contrasena = os.getenv("DB_PASSWORD")
        self.base_datos = os.getenv("DB_NAME")
        self.conexion = None

    def conectar(self):
        self.conexion = mysql.connector.connect(
            host=self.host,
            user=self.usuario,
            password=self.contrasena,
            database=self.base_datos,
        )
        return self.conexion

    def cerrar(self):
        if self.conexion is not None and self.conexion.is_connected():
            self.conexion.close()

    def __enter__(self):
        return self.conectar()

    def __exit__(self, tipo_excepcion, valor_excepcion, traza):
        self.cerrar()
