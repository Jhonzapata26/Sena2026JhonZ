from gestion_bd.cliente_dao import ClienteDAO


def mostrar_menu():
    print("\n=== Gestión de Clientes ===")
    print("1. Insertar cliente")
    print("2. Consultar clientes")
    print("3. Actualizar cliente")
    print("4. Eliminar cliente")
    print("5. Salir")


def insertar_cliente(cliente_dao):
    nombre = input("Nombre: ")
    apellido = input("Apellido: ")
    email = input("Email (opcional): ") or None
    id_generado = cliente_dao.insertar_cliente(nombre, apellido, email)
    print(f"Cliente insertado con id {id_generado}")


def consultar_clientes(cliente_dao):
    clientes = cliente_dao.consultar_clientes()
    if not clientes:
        print("No hay clientes registrados.")
        return
    for cliente in clientes:
        print(cliente)


def actualizar_cliente(cliente_dao):
    id_cliente = input("Id del cliente a actualizar: ")
    nombre = input("Nuevo nombre (Enter para omitir): ")
    apellido = input("Nuevo apellido (Enter para omitir): ")
    campos = {}
    if nombre:
        campos["nombre"] = nombre
    if apellido:
        campos["apellido"] = apellido
    filas_afectadas = cliente_dao.actualizar_cliente(id_cliente, **campos)
    print(f"Filas actualizadas: {filas_afectadas}")


def eliminar_cliente(cliente_dao):
    id_cliente = input("Id del cliente a eliminar: ")
    filas_afectadas = cliente_dao.eliminar_cliente(id_cliente)
    print(f"Filas eliminadas: {filas_afectadas}")


def main():
    cliente_dao = ClienteDAO()
    opciones = {
        "1": insertar_cliente,
        "2": consultar_clientes,
        "3": actualizar_cliente,
        "4": eliminar_cliente,
    }
    while True:
        mostrar_menu()
        opcion = input("Seleccione una opción: ")
        if opcion == "5":
            print("Saliendo...")
            break
        accion = opciones.get(opcion)
        if accion is None:
            print("Opción no válida.")
            continue
        accion(cliente_dao)


if __name__ == "__main__":
    main()
