-- Script para aplicar el schema de Prisma en Supabase cuando migrate deploy se cuelga (pooler IPv4).
-- Ejecutá todo este archivo en: Supabase → SQL Editor → New query → Pegar → Run.
-- ATENCIÓN: Borra las tablas existentes (semanas, dias, ejercicios, ejercicio_semanas, rutinas, usuarios). Hacé backup si tenés datos.

-- Eliminar tablas en orden por FKs
DROP TABLE IF EXISTS "ejercicio_semanas" CASCADE;
DROP TABLE IF EXISTS "ejercicios" CASCADE;
DROP TABLE IF EXISTS "dias" CASCADE;
DROP TABLE IF EXISTS "semanas" CASCADE;
DROP TABLE IF EXISTS "rutinas" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;

-- Crear tablas en orden
CREATE TABLE "usuarios" (
  "id_usuario" SERIAL NOT NULL,
  "usuario" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "nivel" INTEGER NOT NULL,
  "email" TEXT NOT NULL,
  "telefono" TEXT,

  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

CREATE TABLE "rutinas" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,
  "usuarioId" INTEGER NOT NULL,

  CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "semanas" (
  "id" SERIAL NOT NULL,
  "numero" INTEGER NOT NULL,
  "tipo_esfuerzo" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "rutinaId" INTEGER NOT NULL,

  CONSTRAINT "semanas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dias" (
  "id" SERIAL NOT NULL,
  "numero" INTEGER NOT NULL,
  "nombre" TEXT NOT NULL,
  "movilidad" TEXT,
  "activacion" TEXT,
  "semanaId" INTEGER NOT NULL,

  CONSTRAINT "dias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ejercicios" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,
  "codigo" TEXT,
  "video" TEXT,
  "diaId" INTEGER NOT NULL,

  CONSTRAINT "ejercicios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ejercicio_semanas" (
  "id" SERIAL NOT NULL,
  "ejercicioId" INTEGER NOT NULL,
  "semanaId" INTEGER NOT NULL,
  "kg" DOUBLE PRECISION,
  "reps" INTEGER NOT NULL,
  "series" INTEGER NOT NULL,

  CONSTRAINT "ejercicio_semanas_pkey" PRIMARY KEY ("id")
);

-- Índices únicos
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "semanas_rutinaId_numero_key" ON "semanas"("rutinaId", "numero");
CREATE UNIQUE INDEX "dias_semanaId_numero_key" ON "dias"("semanaId", "numero");
CREATE UNIQUE INDEX "ejercicio_semanas_ejercicioId_semanaId_key" ON "ejercicio_semanas"("ejercicioId", "semanaId");

-- Foreign keys
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "semanas" ADD CONSTRAINT "semanas_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "rutinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dias" ADD CONSTRAINT "dias_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "semanas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ejercicios" ADD CONSTRAINT "ejercicios_diaId_fkey" FOREIGN KEY ("diaId") REFERENCES "dias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ejercicio_semanas" ADD CONSTRAINT "ejercicio_semanas_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ejercicio_semanas" ADD CONSTRAINT "ejercicio_semanas_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "semanas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
