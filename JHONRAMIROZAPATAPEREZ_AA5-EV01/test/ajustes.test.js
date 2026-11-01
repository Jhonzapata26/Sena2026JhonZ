// Pruebas de los ajustes de la version 1.1 (evidencia GA11-220501098-AA3-EV01)
const { expect } = require("chai");
const sinon = require("sinon");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto-de-prueba";

const { app, pg } = require("../server");

const tokenValido = jwt.sign({ id: 1, correo: "juan@example.com" }, process.env.JWT_SECRET);
const tokenVencido = jwt.sign(
  { id: 1, correo: "juan@example.com", exp: Math.floor(Date.now() / 1000) - 60 },
  process.env.JWT_SECRET,
);
const tokenFalso = jwt.sign({ id: 1 }, "otra-clave-que-no-es-la-del-servidor");

const usuarioValido = {
  nombre: "Juan Perez",
  edad: 25,
  correo: "juan@example.com",
  contrasena: "clave123",
};

// Error que devuelve PostgreSQL cuando se viola una restriccion UNIQUE
const errorCorreoRepetido = Object.assign(new Error("duplicate key value"), { code: "23505" });
const errorBaseDeDatos = new Error("connection terminated unexpectedly");

describe("Ajustes v1.1", () => {
  let queryStub;

  beforeEach(() => {
    queryStub = sinon.stub(pg, "query");
    // Evita que el middleware de errores llene la consola durante las pruebas
    sinon.stub(console, "error");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("AJ-08 · Autenticacion con token en PUT y DELETE (D10)", () => {
    it("PUT sin token responde 401 y no toca la base de datos", async () => {
      const res = await request(app).put("/UsuariosRegistrados/1").send({ nombre: "X" });

      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: "Token no enviado" });
      expect(queryStub.called).to.be.false;
    });

    it("DELETE sin token responde 401 y no toca la base de datos", async () => {
      const res = await request(app).delete("/UsuariosRegistrados/1");

      expect(res.status).to.equal(401);
      expect(queryStub.called).to.be.false;
    });

    it("rechaza un token vencido con 401", async () => {
      const res = await request(app)
        .delete("/UsuariosRegistrados/1")
        .set("Authorization", `Bearer ${tokenVencido}`);

      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: "Token invalido o vencido" });
    });

    it("rechaza un token firmado con otra clave con 401", async () => {
      const res = await request(app)
        .put("/UsuariosRegistrados/1")
        .set("Authorization", `Bearer ${tokenFalso}`)
        .send({ nombre: "X" });

      expect(res.status).to.equal(401);
      expect(queryStub.called).to.be.false;
    });

    it("rechaza una cabecera sin el prefijo Bearer con 401", async () => {
      const res = await request(app)
        .delete("/UsuariosRegistrados/1")
        .set("Authorization", tokenValido);

      expect(res.status).to.equal(401);
    });

    it("el token de sign-in vence en una hora", async () => {
      const hash = await bcrypt.hash("clave123", 10);
      queryStub.resolves({ rows: [{ id: 7, correo: "juan@example.com", contrasena: hash }] });

      const res = await request(app)
        .post("/sign-in")
        .send({ correo: "juan@example.com", contrasena: "clave123" });

      const datos = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(datos.id).to.equal(7);
      expect(datos.exp - datos.iat).to.equal(3600);
    });
  });

  describe("AJ-09 · Manejo de errores de la base de datos (D06)", () => {
    it("sign-up responde 500 controlado si falla la base de datos", async () => {
      queryStub.rejects(errorBaseDeDatos);

      const res = await request(app).post("/sign-up").send(usuarioValido);

      expect(res.status).to.equal(500);
      expect(res.body).to.deep.equal({ error: "Error interno del servidor" });
    });

    it("sign-in responde 500 controlado si falla la base de datos", async () => {
      queryStub.rejects(errorBaseDeDatos);

      const res = await request(app)
        .post("/sign-in")
        .send({ correo: "juan@example.com", contrasena: "clave123" });

      expect(res.status).to.equal(500);
      expect(res.body).to.deep.equal({ error: "Error interno del servidor" });
    });

    it("GET responde 500 controlado si falla la base de datos", async () => {
      queryStub.rejects(errorBaseDeDatos);

      const res = await request(app).get("/UsuariosRegistrados").query({ nombre: "Juan" });

      expect(res.status).to.equal(500);
      expect(res.body).to.deep.equal({ error: "Error interno del servidor" });
    });

    it("DELETE responde 500 controlado si falla la base de datos", async () => {
      queryStub.rejects(errorBaseDeDatos);

      const res = await request(app)
        .delete("/UsuariosRegistrados/1")
        .set("Authorization", `Bearer ${tokenValido}`);

      expect(res.status).to.equal(500);
      expect(res.body).to.deep.equal({ error: "Error interno del servidor" });
    });

    it("la respuesta 500 no expone detalles internos del error", async () => {
      queryStub.rejects(errorBaseDeDatos);

      const res = await request(app).post("/sign-up").send(usuarioValido);

      // La respuesta debe ser JSON controlado, no la pagina de error por defecto
      expect(res.type).to.equal("application/json");
      expect(res.text).to.not.include("connection terminated");
      expect(res.text).to.not.include("at ");
    });
  });

  describe("AJ-10 · Correo repetido (D07)", () => {
    it("sign-up con un correo ya registrado responde 409", async () => {
      queryStub.rejects(errorCorreoRepetido);

      const res = await request(app).post("/sign-up").send(usuarioValido);

      expect(res.status).to.equal(409);
      expect(res.body).to.deep.equal({ error: "El correo ya esta registrado" });
    });

    it("PUT con un correo que ya usa otro usuario responde 409", async () => {
      queryStub.rejects(errorCorreoRepetido);

      const res = await request(app)
        .put("/UsuariosRegistrados/1")
        .set("Authorization", `Bearer ${tokenValido}`)
        .send({ correo: "otro@example.com" });

      expect(res.status).to.equal(409);
    });
  });

  describe("AJ-11 · Edad como numero entero y valores limite (D08, RF-03)", () => {
    for (const edad of [17, 70]) {
      it(`acepta la edad limite ${edad}`, async () => {
        queryStub.resolves({ rows: [{ id: 1 }] });

        const res = await request(app).post("/sign-up").send({ ...usuarioValido, edad });

        expect(res.status).to.equal(201);
      });
    }

    for (const [edad, descripcion] of [[16, "16"], [71, "71"]]) {
      it(`rechaza la edad limite ${descripcion}`, async () => {
        const res = await request(app).post("/sign-up").send({ ...usuarioValido, edad });

        expect(res.status).to.equal(400);
        expect(queryStub.called).to.be.false;
      });
    }

    for (const [edad, descripcion] of [[25.5, "decimal 25.5"], ["veinte", "texto \"veinte\""], ["25", "texto \"25\""]]) {
      it(`rechaza la edad ${descripcion}`, async () => {
        const res = await request(app).post("/sign-up").send({ ...usuarioValido, edad });

        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal({ error: "La edad debe ser un numero entero" });
        expect(queryStub.called).to.be.false;
      });
    }
  });
});
