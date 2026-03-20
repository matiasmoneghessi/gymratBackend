-- Migración incremental: agrega catalogo_ejercicios, imagen y FK en ejercicios.
-- Ejecutá este archivo en: Supabase → SQL Editor → New query → Pegar → Run.
-- NO borra datos existentes.

-- 1. Crear tabla catálogo si no existe
CREATE TABLE IF NOT EXISTS "catalogo_ejercicios" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,

  CONSTRAINT "catalogo_ejercicios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "catalogo_ejercicios_nombre_key" ON "catalogo_ejercicios"("nombre");

-- 2. Agregar columna imagen a ejercicios si no existe
ALTER TABLE "ejercicios" ADD COLUMN IF NOT EXISTS "imagen" TEXT;

-- 3. Agregar columna catalogoEjercicioId a ejercicios si no existe
ALTER TABLE "ejercicios" ADD COLUMN IF NOT EXISTS "catalogoEjercicioId" INTEGER;

-- 4. Agregar FK si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ejercicios_catalogoEjercicioId_fkey'
  ) THEN
    ALTER TABLE "ejercicios"
      ADD CONSTRAINT "ejercicios_catalogoEjercicioId_fkey"
      FOREIGN KEY ("catalogoEjercicioId")
      REFERENCES "catalogo_ejercicios"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
$$;
