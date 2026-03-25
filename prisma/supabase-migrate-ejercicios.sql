-- Migración incremental: renombra ejercicios → ejercicio_usuario, mueve video/imagen a catalogo_ejercicios.
-- Ejecutá este archivo en: Supabase → SQL Editor → New query → Pegar → Run.
-- NO borra datos existentes.

-- 1. Crear tabla catálogo si no existe
CREATE TABLE IF NOT EXISTS "catalogo_ejercicios" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,
  "video" TEXT,
  "imagen" TEXT,

  CONSTRAINT "catalogo_ejercicios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "catalogo_ejercicios_nombre_key" ON "catalogo_ejercicios"("nombre");

-- 2. Agregar columnas a catalogo_ejercicios si no existen
ALTER TABLE "catalogo_ejercicios" ADD COLUMN IF NOT EXISTS "descripcion" TEXT;
ALTER TABLE "catalogo_ejercicios" ADD COLUMN IF NOT EXISTS "video" TEXT;
ALTER TABLE "catalogo_ejercicios" ADD COLUMN IF NOT EXISTS "imagen" TEXT;

-- 3. Renombrar tabla ejercicios → ejercicio_usuario (si aún no fue renombrada)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejercicios')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ejercicio_usuario') THEN
    ALTER TABLE "ejercicios" RENAME TO "ejercicio_usuario";
  END IF;
END;
$$;

-- 4. Quitar columnas video e imagen de ejercicio_usuario si existen
ALTER TABLE "ejercicio_usuario" DROP COLUMN IF EXISTS "video";
ALTER TABLE "ejercicio_usuario" DROP COLUMN IF EXISTS "imagen";

-- 5. Agregar columna catalogo_ejercicio_id si no existe
--    (renombrar de catalogoEjercicioId si aún existe con el nombre viejo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ejercicio_usuario' AND column_name = 'catalogoEjercicioId'
  ) THEN
    ALTER TABLE "ejercicio_usuario" RENAME COLUMN "catalogoEjercicioId" TO "catalogo_ejercicio_id";
  ELSE
    ALTER TABLE "ejercicio_usuario" ADD COLUMN IF NOT EXISTS "catalogo_ejercicio_id" INTEGER;
  END IF;
END;
$$;

-- 6. Crear tabla serie_detalles si no existe
CREATE TABLE IF NOT EXISTS "serie_detalles" (
  "id" SERIAL NOT NULL,
  "ejercicio_semana_id" INTEGER NOT NULL,
  "numero_serie" INTEGER NOT NULL,
  "kg" DOUBLE PRECISION,
  "reps" INTEGER,

  CONSTRAINT "serie_detalles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "serie_detalles_ejercicio_semana_id_numero_serie_key"
  ON "serie_detalles"("ejercicio_semana_id", "numero_serie");

DO $$
BEGIN
  -- Renombrar columna si aún existe con el nombre viejo
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'serie_detalles' AND column_name = 'ejercicioSemanaId'
  ) THEN
    ALTER TABLE "serie_detalles" RENAME COLUMN "ejercicioSemanaId" TO "ejercicio_semana_id";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'serie_detalles_ejercicio_semana_id_fkey'
  ) THEN
    ALTER TABLE "serie_detalles"
      ADD CONSTRAINT "serie_detalles_ejercicio_semana_id_fkey"
      FOREIGN KEY ("ejercicio_semana_id")
      REFERENCES "ejercicio_semanas"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END;
$$;

-- 7. Agregar FK de ejercicio_usuario → catalogo_ejercicios si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ejercicio_usuario_catalogo_ejercicio_id_fkey'
  ) THEN
    ALTER TABLE "ejercicio_usuario"
      ADD CONSTRAINT "ejercicio_usuario_catalogo_ejercicio_id_fkey"
      FOREIGN KEY ("catalogo_ejercicio_id")
      REFERENCES "catalogo_ejercicios"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
$$;
