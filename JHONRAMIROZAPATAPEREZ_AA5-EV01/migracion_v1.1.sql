-- Migracion de la version 1.0.0 a la 1.1 (AJ-10, defecto D07)
-- Ejecutar UNA sola vez en el editor SQL de Supabase sobre la tabla existente.

-- Paso 1: revisar si ya hay correos repetidos (si la consulta no devuelve filas, seguir al paso 2)
SELECT correo, COUNT(*) AS veces
FROM public."UsuariosRegistrados"
GROUP BY correo
HAVING COUNT(*) > 1;

-- Paso 2: agregar la restriccion de correo unico
ALTER TABLE public."UsuariosRegistrados"
  ADD CONSTRAINT usuarios_correo_unico UNIQUE (correo);
