// Carga las variables de entorno definidas en el archivo .env (por ejemplo, DATABASE_URL)
require("dotenv").config();
// Framework para crear el servidor y las rutas HTTP
const express = require("express");
// Libreria para encriptar (hash) y comparar contrasenas
const bcrypt = require("bcryptjs");
// Middleware para permitir peticiones desde otros origenes (CORS)
const cors = require("cors");
// Pool de conexiones para hablar con la base de datos Postgres
const { Pool } = require("pg");

// Instancia principal del servidor Express
const app = express();
// Permite que Express interprete el body de las peticiones como JSON
app.use(express.json());
// Habilita CORS para que el cliente (registroInicio.html) pueda consumir la API
app.use(cors("*"));
// Conexion a la base de datos usando la URL definida en .env
const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Ruta para registrar un nuevo usuario
app.post("/sign-up", async (request, response) => {
  // Extrae los datos enviados desde el formulario de registro
  const { nombre, edad, correo, contrasena } = request.body;

  // Valida que el nombre haya sido enviado
  if (!nombre) {
    return response
      .status(400)
      .json({ error: "El nombre no ha sido ingresado" });
  }

  // Valida que la edad haya sido enviada
  if (!edad) {
    return response.status(400).json({ error: "La edad no ha sido ingresada" });
  }

  // Valida que el correo haya sido enviado
  if (!correo) {
    return response
      .status(400)
      .json({ error: "El correo no ha sido ingresado" });
  }

  // Valida que la contrasena haya sido enviada
  if (!contrasena) {
    return response
      .status(400)
      .json({ error: "La contrasena no ha sido ingresada" });
  }

  // Rechaza edades menores a 17 (pero mayores a 0)
  if (edad > 0 && edad < 17) {
    return response
      .status(400)
      .json({ error: "No cuenta con la edad suficiente" });
  }

  // Rechaza edades mayores a 70
  if (edad > 70) {
    return response.status(400).json({ error: "Edad fuera del rango maximo" });
  }

  // Genera una sal aleatoria para el hash de la contrasena
  const salt = await bcrypt.genSalt(10);
  // Encripta la contrasena antes de guardarla en la base de datos
  const hash = await bcrypt.hash(contrasena, salt);

  // Inserta el nuevo usuario en la tabla UsuariosRegistrados
  const nuevoUsuario = await pg.query(
    `INSERT INTO public."UsuariosRegistrados" (nombre, edad, correo, contrasena) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, edad, correo, hash],
  );

  // Confirma que el usuario fue creado correctamente
  return response.status(201).json({ message: "Usuario Registrado!" });
});

// Ruta para iniciar sesion con un usuario existente
app.post("/sign-in", async (request, response) => {
  // Extrae las credenciales enviadas desde el formulario de login
  const { correo, contrasena } = request.body;

  // Valida que el correo haya sido enviado
  if (!correo) {
    return response.status(400).json({ error: "Correo invalido" });
  }

  // Valida que la contrasena haya sido enviada
  if (!contrasena) {
    return response.status(400).json({ error: "Contrasena incorrecta" });
  }

  // Busca al usuario en la base de datos por su correo
  const usuario = await pg.query(
    `SELECT * FROM public."UsuariosRegistrados" WHERE correo = $1`,
    [correo],
  );

  // Si no se encuentra ningun usuario con ese correo, retorna error
  if (usuario.rows.length === 0) {
    return response.status(401).json({ error: "El usuario no existe" });
  }

  // Compara la contrasena enviada contra el hash guardado en la base de datos
  const validarcontrasena = await bcrypt.compare(
    contrasena,
    usuario.rows[0].contrasena,
  );

  // Si la contrasena no coincide, retorna error
  if (!validarcontrasena) {
    return response.status(401).json({ error: "Contrasena incorrecta" });
  }

  // Inicio de sesion exitoso
  return response.status(200).json({ message: "Bienvenido!" });
});

// Ruta para consultar usuarios registrados por nombre o correo
app.get("/UsuariosRegistrados", async (request, response) => {
  // Extrae los parametros de busqueda enviados por query string
  const { nombre, correo } = request.query;

  // Exige que se envie al menos un criterio de busqueda
  if (!nombre && !correo) {
    return response
      .status(400)
      .json({ error: "No has enviado el nombre y el correo" });
  }

  // Variable donde se guardara el resultado de la consulta
  let usuarios;

  // Busca por nombre si fue enviado
  if (nombre) {
    usuarios = await pg.query(
      `SELECT * FROM public."UsuariosRegistrados" WHERE nombre = $1`,
      [nombre],
    );
  } else {
    // Si no se envio nombre, busca por correo
    usuarios = await pg.query(
      `SELECT * FROM public."UsuariosRegistrados" WHERE correo = $1`,
      [correo],
    );
  }

  // Si no se encontro ningun usuario, retorna error
  if (usuarios.rows.length === 0) {
    return response.status(400).json({ error: "No hay usuarios" });
  }

  // Elimina la contrasena de cada usuario antes de responder al cliente
  usuarios = usuarios.rows.filter((values) => {
    delete values.contrasena;

    return values;
  });

  // Devuelve la lista de usuarios sin la contrasena
  return response.status(200).json(usuarios || []);
});

//Ruta para actualizar un usuario segun su id
app.put("/UsuariosRegistrados/:id", async (request, response) => {
  const { id } = request.params;
  const { nombre, edad, correo, contrasena } = request.body;

  if (!id) {
    return response.status(400).json({ error: "ID no definida" });
  }

  // Código que puede fallar o dar un error
  try {
    // Arrays dinámicos
    const campos = [];
    const valores = [];
    let contador = 1;

    // Solo agregamos los campos que realmente llegaron
    if (nombre !== undefined) {
      campos.push(`nombre = $${contador}`);
      valores.push(nombre);
      contador++;
    }

    if (edad !== undefined) {
      campos.push(`edad = $${contador}`);
      valores.push(edad);
      contador++;
    }

    if (correo !== undefined) {
      campos.push(`correo = $${contador}`);
      valores.push(correo);
      contador++;
    }

    if (contrasena !== undefined) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(contrasena, salt);
      campos.push(`contrasena = $${contador}`);
      valores.push(hash);
      contador++;
    }

    // Si no enviaron ningún campo para actualizar
    if (campos.length === 0) {
      return response
        .status(400)
        .json({ error: "No se enviaron datos para actualizar" });
    }

    // Agregamos el id al final
    valores.push(id);

    const query = `
      UPDATE public."UsuariosRegistrados"
      SET ${campos.join(", ")}
      WHERE ID = $${contador}
      RETURNING *
    `;

    const usuarioActualizado = await pg.query(query, valores);

    if (usuarioActualizado.rows.length === 0) {
      return response.status(404).json({ error: "El usuario no existe" });
    }

    // Quitamos la contraseña de la respuesta
    const { contrasena: _, ...usuarioSinContrasena } =
      usuarioActualizado.rows[0];

    return response.status(200).json({
      message: "El usuario ha sido actualizado con éxito",
      usuario: usuarioSinContrasena,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ error: "Ha ocurrido un error al actualizar el usuario" });
  }
});

// Ruta para eliminar un usuario registrado segun su id
app.delete("/UsuariosRegistrados{/:id}", async (request, response) => {
  // Extrae el id del usuario desde los parametros de la ruta
  const { id } = request.params;

  // Valida que el id haya sido enviado
  if (!id) {
    return response.status(400).json({ error: "ID no definida" });
  }

  // Elimina el usuario de la base de datos y retorna la fila eliminada (si existe)
  const usuarioEliminado = await pg.query(
    `DELETE FROM public."UsuariosRegistrados" WHERE id = $1 RETURNING *`,
    [id],
  );

  // Si no se elimino ninguna fila, el usuario no existia
  if (usuarioEliminado.rows.length === 0) {
    return response.status(404).json({ error: "El usuario no existe" });
  }

  // Confirma que el usuario fue eliminado
  return response.status(200).json({ message: "Usuario eliminado!" });
});

// Inicia el servidor en el puerto 8080
app.listen(8080, () => {
  console.log("Servidor iniciado en el puerto 8080");
});
