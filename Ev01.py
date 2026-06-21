# ejemplo donde nombraremos variables y declaramos calses y metodos

nombreCompleto = "Jhon Zapata"                  # declaracion y asignación de variable tipo texto o cadena
edad = 29                                       # declaracion y asignación de variable tipo entero                         
estatura = 1.75                                 # declaracion y asignación de variable tipo flotante
esEstudiante = True                             # declaración y asignación de variable tipo boleano
hobbies = ["lectura", "futbol", "billar"]       # declaración de una lista con valores asignados

#  Declaración de la clase 

class Persona:        # Esta clase representa a una persona
    
    # Este es el método constructor (se ejecuta al crear un objeto)
    def __init__(self, nombre, edad, estatura):
        self.nombre = nombre                        # esta línea representa un atributo de la instancia
        self.edad = edad
        self.estatura = estatura
        self.activo = True                          # valor por defecto

    # aquí se realiza la declaración de los métodos
    def saludar(self):
        print(f"Hola, me llamo {self.nombre} y tengo {self.edad} años.")
        
    def cumplirAnios(self):
        self.edad += 1
        print(f"Hoy estoy de cumpleaños! Ahora tengo {self.edad} años.")
    
    def mayorDeEdad(self):
        return self.edad >= 18
    
    def mostrarInfo(self):
        print("\n--- Informacion de la persona ---")
        print(f"Nombre: {self.nombre}")
        print(f"Edad: {self.edad}")
        print(f"Estatura: {self.estatura}")
        print(f"Activo: {self.activo}")

# En esta parte le damos uso al código creando un objeto (instancia) de la clase persona
if __name__ == "__main__":
    persona1 = Persona("Ximena Lopez", 21, 1.65)
    persona2 = Persona(nombreCompleto, edad, estatura)

# Y por último llamamos los métodos que se quieren ejecutar
    persona1.saludar()
    persona1.cumplirAnios()
    persona1.mostrarInfo()
    persona2.saludar()
    persona2.mostrarInfo()

    print(f"\n ¿Es mayor de edad? {persona1.mayorDeEdad()}")
