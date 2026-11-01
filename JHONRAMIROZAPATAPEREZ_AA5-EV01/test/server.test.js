const { expect } = require("chai");
const sinon = require("sinon");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Clave de prueba para firmar tokens (en produccion se toma del archivo .env)
process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto-de-prueba";

const { app, pg } = require("../server");

// Token valido para las rutas protegidas (PUT y DELETE) - AJ-08
const token = jwt.sign({ id: 1, correo: "juan@example.com" }, process.env.JWT_SECRET);
const autorizacion = `Bearer ${token}`;

describe("API UsuariosRegistrados (server.js)", () => {
  let queryStub;

  beforeEach(() => {
    // Reemplaza las consultas reales a Postgres por un stub controlado en cada test
    queryStub = sinon.stub(pg, "query");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("POST /sign-up", () => {
    const usuarioValido = {
      nombre: "Juan Perez",
      edad: 25,
      correo: "juan@example.com",
      contrasena: "clave123",
    };

    it("registra un usuario correctamente cuando los datos son validos", async () => {
      queryStub.resolves({
        rows: [{ id: 1, ...usuarioValido, contrasena: "hash" }],
      });

      const res = await request(app).post("/sign-up").send(usuarioValido);

      expect(res.status).to.equal(201);
      expect(res.body).to.deep.equal({ message: "Usuario Registrado!" });
      expect(queryStub.calledOnce).to.be.true;

      // La contrasena almacenada debe estar hasheada, nunca en texto plano
      const contrasenaGuardada = queryStub.firstCall.args[1][3];
      expect(contrasenaGuardada).to.not.equal(usuarioValido.contrasena);
    });

    it("rechaza el registro si falta el nombre", async () => {
      const { nombre, ...resto } = usuarioValido;
      const res = await request(app).post("/sign-up").send(resto);

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({
        error: "El nombre no ha sido ingresado",
      });
      expect(queryStub.called).to.be.false;
    });

    it("rechaza el registro si falta la edad", async () => {
      const { edad, ...resto } = usuarioValido;
      const res = await request(app).post("/sign-up").send(resto);

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: "La edad no ha sido ingresada" });
    });

    it("rechaza el registro si falta el correo", async () => {
      const { correo, ...resto } = usuarioValido;
      const res = await request(app).post("/sign-up").send(resto);

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({
        error: "El correo no ha sido ingresado",
      });
    });

    it("rechaza el registro si falta la contrasena", async () => {
      const { contrasena, ...resto } = usuarioValido;
      const res = await request(app).post("/sign-up").send(resto);

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({
        error: "La contrasena no ha sido ingresada",
      });
    });

    it("rechaza edades menores a 17", async () => {
      const res = await request(app)
        .post("/sign-up")
        .send({ ...usuarioValido, edad: 16 });

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({
        error: "No cuenta con la edad suficiente",
      });
    });

    it("rechaza edades mayores a 70", async () => {
      const res = await request(app)
        .post("/sign-up")
        .send({ ...usuarioValido, edad: 71 });

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: "Edad fuera del rango maximo" });
    });
  });

  describe("POST /sign-in", () => {
    it("inicia sesion correctamente con credenciales validas", async () => {
      const hash = await bcrypt.hash("clave123", 10);
      queryStub.resolves({
        rows: [{ id: 1, correo: "juan@example.com", contrasena: hash }],
      });

      const res = await request(app)
        .post("/sign-in")
        .send({ correo: "juan@example.com", contrasena: "clave123" });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("Bienvenido!");
      // AJ-08: el inicio de sesion devuelve un token JWT valido
      const datos = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(datos.correo).to.equal("juan@example.com");
    });

    it("rechaza el login si falta el correo", async () => {
      const res = await request(app)
        .post("/sign-in")
        .send({ contrasena: "clave123" });

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: "Correo invalido" });
    });

    it("rechaza el login si falta la contrasena", async () => {
      const res = await request(app)
        .post("/sign-in")
        .send({ correo: "juan@example.com" });

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: "Contrasena incorrecta" });
    });

    it("rechaza el login si el usuario no existe", async () => {
      queryStub.resolves({ rows: [] });

      const res = await request(app)
        .post("/sign-in")
        .send({ correo: "noexiste@example.com", contrasena: "clave123" });

      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: "El usuario no existe" });
    });

    it("rechaza el login si la contrasena no coincide", async () => {
      const hash = await bcrypt.hash("otraClave", 10);
      queryStub.resolves({
        rows: [{ id: 1, correo: "juan@example.com", contrasena: hash }],
      });

      const res = await request(app)
        .post("/sign-in")
        .send({ correo: "juan@example.com", contrasena: "clave123" });

      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: "Contrasena incorrecta" });
    });
  });

  describe("GET /UsuariosRegistrados", () => {
    it("retorna usuarios filtrando por nombre y sin exponer la contrasena", async () => {
      queryStub.resolves({
        rows: [
          {
            id: 1,
            nombre: "Juan Perez",
            edad: 25,
            correo: "juan@example.com",
            contrasena: "hash",
          },
        ],
      });

      const res = await request(app)
        .get("/UsuariosRegistrados")
        .query({ nombre: "Juan Perez" });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.not.have.property("contrasena");
      expect(res.body[0].nombre).to.equal("Juan Perez");
    });

    it("retorna usuarios filtrando por correo cuando no se envia nombre", async () => {
      queryStub.resolves({
        rows: [
          {
            id: 1,
            nombre: "Juan Perez",
            edad: 25,
            correo: "juan@example.com",
            contrasena: "hash",
          },
        ],
      });

      const res = await request(app)
        .get("/UsuariosRegistrados")
        .query({ correo: "juan@example.com" });

      expect(res.status).to.equal(200);
      expect(res.body[0].correo).to.equal("juan@example.com");
    });

    it("rechaza la busqueda si no se envia nombre ni correo", async () => {
      const res = await request(app).get("/UsuariosRegistrados");

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({
        error: "No has enviado el nombre y el correo",
      });
      expect(queryStub.called).to.be.false;
    });

    it("retorna error si no se encuentran usuarios", async () => {
      queryStub.resolves({ rows: [] });

      const res = await request(app)
        .get("/UsuariosRegistrados")
        .query({ nombre: "Inexistente" });

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: "No hay usuarios" });
    });
  });

  describe("PUT /UsuariosRegistrados/:id", () => {
    it("actualiza un usuario correctamente", async () => {
      queryStub.resolves({
        rows: [
          {
            id: 1,
            nombre: "Nuevo Nombre",
            edad: 30,
            correo: "nuevo@example.com",
            contrasena: "hash",
          },
        ],
      });

      const res = await request(app)
        .put("/UsuariosRegistrados/1")
        .set("Authorization", autorizacion)
        .send({ nombre: "Nuevo Nombre" });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal(
        "El usuario ha sido actualizado con éxito",
      );
      expect(res.body.usuario).to.not.have.property("contrasena");
    });

    it("hashea la contrasena cuando se incluye en la actualizacion", async () => {
      queryStub.resolves({
        rows: [
          {
            id: 1,
            nombre: "Juan",
            edad: 25,
            correo: "juan@example.com",
            contrasena: "hash",
          },
        ],
      });

      await request(app)
        .put("/UsuariosRegistrados/1")
        .set("Authorization", autorizacion)
        .send({ contrasena: "nuevaClave" });

      const valoresQuery = queryStub.firstCall.args[1];
      expect(valoresQuery).to.not.include("nuevaClave");
    });

    it("rechaza la actualizacion si el id no es numerico", async () => {
      const res = await request(app)
        .put("/UsuariosRegistrados/abc")
        .set("Authorization", autorizacion)
        .send({ nombre: "Nuevo Nombre" });

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: "ID invalida" });
      expect(queryStub.called).to.be.false;
    });

    it("rechaza la actualizacion si no se envian campos", async () => {
      const res = await request(app).put("/UsuariosRegistrados/1")
        .set("Authorization", autorizacion).send({});

      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({
        error: "No se enviaron datos para actualizar",
      });
    });

    it("retorna 404 si el usuario a actualizar no existe", async () => {
      queryStub.resolves({ rows: [] });

      const res = await request(app)
        .put("/UsuariosRegistrados/999")
        .set("Authorization", autorizacion)
        .send({ nombre: "Nuevo Nombre" });

      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: "El usuario no existe" });
    });

    it("retorna 500 si ocurre un error en la base de datos", async () => {
      queryStub.rejects(new Error("Error de conexion"));

      const res = await request(app)
        .put("/UsuariosRegistrados/1")
        .set("Authorization", autorizacion)
        .send({ nombre: "Nuevo Nombre" });

      expect(res.status).to.equal(500);
      expect(res.body).to.deep.equal({
        error: "Ha ocurrido un error al actualizar el usuario",
      });
    });
  });

  describe("DELETE /UsuariosRegistrados/:id", () => {
    it("elimina un usuario correctamente", async () => {
      queryStub.resolves({ rows: [{ id: 1 }] });

      const res = await request(app).delete("/UsuariosRegistrados/1")
        .set("Authorization", autorizacion);

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ message: "Usuario eliminado!" });
    });

    it("retorna 404 si el usuario a eliminar no existe", async () => {
      queryStub.resolves({ rows: [] });

      const res = await request(app).delete("/UsuariosRegistrados/999")
        .set("Authorization", autorizacion);

      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: "El usuario no existe" });
    });
  });
});
