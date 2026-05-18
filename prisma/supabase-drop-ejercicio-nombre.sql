-- Migración: ejercicio_usuario usa solo catalogo_ejercicio_id (sin columna nombre).
-- Ejecutá en Supabase → SQL Editor después de desplegar el backend actualizado.

-- 1. Crear entradas en catálogo para ejercicios huérfanos (sin catalogo_ejercicio_id)
INSERT INTO "catalogo_ejercicios" ("nombre")
SELECT DISTINCT eu."nombre"
FROM "ejercicio_usuario" eu
WHERE eu."catalogo_ejercicio_id" IS NULL
  AND eu."nombre" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "catalogo_ejercicios" ce WHERE ce."nombre" = eu."nombre"
  );

-- 2. Vincular ejercicios huérfanos al catálogo
UPDATE "ejercicio_usuario" eu
SET "catalogo_ejercicio_id" = ce."id"
FROM "catalogo_ejercicios" ce
WHERE eu."catalogo_ejercicio_id" IS NULL
  AND eu."nombre" IS NOT NULL
  AND ce."nombre" = eu."nombre";

-- 3. Eliminar filas sin catálogo (no deberían existir en producción)
DELETE FROM "ejercicio_usuario" WHERE "catalogo_ejercicio_id" IS NULL;

-- 4. Hacer obligatorio el FK y quitar nombre duplicado
ALTER TABLE "ejercicio_usuario" ALTER COLUMN "catalogo_ejercicio_id" SET NOT NULL;
ALTER TABLE "ejercicio_usuario" DROP COLUMN IF EXISTS "nombre";
