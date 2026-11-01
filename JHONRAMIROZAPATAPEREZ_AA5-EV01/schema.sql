-- Script de creacion de la base de datos (AJ-12, defecto D09)
-- Ejecutar en el editor SQL de Supabase para instalar la API desde cero.
CREATE TABLE IF NOT EXISTS public."UsuariosRegistrados" (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  edad        INTEGER NOT NULL CHECK (edad BETWEEN 17 AND 70),
  correo      VARCHAR(150) NOT NULL UNIQUE,   -- AJ-10: no se permiten correos repetidos
  contrasena  TEXT NOT NULL                   -- hash bcrypt, nunca texto plano
);
