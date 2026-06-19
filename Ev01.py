# ejemplo donde nombraremos variables y declaramos calses y metodos

nombreCompleto = "Jhon Zapata"
edad = 29
estatura = 1.75
esEstudiante = True
hobbies = ["lectura", "futbol", "billar"]

class Persona:
    
    def __init__(self, nombre, edad, estatura):
        self.nombre = nombre
        self.edad = edad
        self.estatura = estatura
        self.activo = True

    def saludar(self):
        print(f"Hola, me llamo {self.nombre} y tengo {self.edad} años.")
        
    def cumplirAnios(self):
        self.edad += 1
        print(f"Feliz cumpleaños! Ahora tengo {self.edad} años.")
    
    def mayorDeEdad(self):
        return self.edad >= 18
    
    def mostrarInfo(self):
        print("\n--- Informacion de la persona ---")
        print(f"Nombre: {self.nombre}")
        print(f"Edad: {self.edad}")
        print(f"Estatura: {self.estatura}")
        print(f"Activo: {self.activo}")

if __name__ == "__main__":
    persona1 = Persona("Ximena Lopez", 21, 1.65)
    persona2 = Persona(nombreCompleto, edad, estatura)

    persona1.saludar()
    persona1.cumplirAnios()
    persona1.mostrarInfo()
    persona2.saludar()
    persona2.mostrarInfo()

    print(f"\n ¿Es mayor de edad? {persona1.mayorDeEdad()}")