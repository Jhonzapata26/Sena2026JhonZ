from gestion_bd.conexion_bd import ConexionBD


class ClienteDAO:
    def __init__(self):
        self.conexion_bd = ConexionBD()

    def insertar_cliente(self, nombre, apellido, email=None, saldo=0.0,
                          observaciones=None, fecha_nacimiento=None):
        consulta = (
            "INSERT INTO clientes "
            "(nombre, apellido, email, saldo, observaciones, fecha_nacimiento) "
            "VALUES (%s, %s, %s, %s, %s, %s)"
        )
        valores = (nombre, apellido, email, saldo, observaciones, fecha_nacimiento)
        with self.conexion_bd as conexion:
            cursor = conexion.cursor()
            cursor.execute(consulta, valores)
            conexion.commit()
            id_generado = cursor.lastrowid
            cursor.close()
        return id_generado

    def consultar_clientes(self):
        with self.conexion_bd as conexion:
            cursor = conexion.cursor(dictionary=True)
            cursor.execute("SELECT * FROM clientes")
            resultados = cursor.fetchall()
            cursor.close()
        return resultados

    def consultar_cliente_por_id(self, id_cliente):
        with self.conexion_bd as conexion:
            cursor = conexion.cursor(dictionary=True)
            cursor.execute("SELECT * FROM clientes WHERE id = %s", (id_cliente,))
            resultado = cursor.fetchone()
            cursor.close()
        return resultado

    def actualizar_cliente(self, id_cliente, **campos):
        if not campos:
            return 0
        asignaciones = ", ".join(f"{campo} = %s" for campo in campos)
        valores = list(campos.values()) + [id_cliente]
        consulta = f"UPDATE clientes SET {asignaciones} WHERE id = %s"
        with self.conexion_bd as conexion:
            cursor = conexion.cursor()
            cursor.execute(consulta, valores)
            conexion.commit()
            filas_afectadas = cursor.rowcount
            cursor.close()
        return filas_afectadas

    def eliminar_cliente(self, id_cliente):
        with self.conexion_bd as conexion:
            cursor = conexion.cursor()
            cursor.execute("DELETE FROM clientes WHERE id = %s", (id_cliente,))
            conexion.commit()
            filas_afectadas = cursor.rowcount
            cursor.close()
        return filas_afectadas
