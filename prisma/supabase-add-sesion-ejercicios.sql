-- Migración: detalle de ejercicios y series por sesión (sesion_ejercicios, sesion_series).
-- Ejecutá en Supabase → SQL Editor antes de desplegar el backend actualizado.
-- Las sesiones existentes quedan sin detalle (GET /sesiones devuelve ejercicios: []).

CREATE TABLE IF NOT EXISTS "sesion_ejercicios" (
  "id"                    SERIAL  NOT NULL,
  "sesion_id"             INTEGER NOT NULL,
  "ejercicio_id"          INTEGER,
  "catalogo_ejercicio_id" INTEGER NOT NULL,
  "orden"                 INTEGER NOT NULL,
  "completado"            BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "sesion_ejercicios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sesion_series" (
  "id"                  SERIAL           NOT NULL,
  "sesion_ejercicio_id" INTEGER          NOT NULL,
  "numero_serie"        INTEGER          NOT NULL,
  "kg"                  DOUBLE PRECISION,
  "reps"                INTEGER          NOT NULL,
  "completada"          BOOLEAN          NOT NULL DEFAULT false,

  CONSTRAINT "sesion_series_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sesion_ejercicios_sesion_id_idx"             ON "sesion_ejercicios"("sesion_id");
CREATE INDEX IF NOT EXISTS "sesion_ejercicios_catalogo_ejercicio_id_idx" ON "sesion_ejercicios"("catalogo_ejercicio_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sesion_series_sesion_ejercicio_id_numero_serie_key" ON "sesion_series"("sesion_ejercicio_id", "numero_serie");

ALTER TABLE "sesion_ejercicios" ADD CONSTRAINT "sesion_ejercicios_sesion_id_fkey"             FOREIGN KEY ("sesion_id")             REFERENCES "sesiones"("id")            ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "sesion_ejercicios" ADD CONSTRAINT "sesion_ejercicios_ejercicio_id_fkey"          FOREIGN KEY ("ejercicio_id")          REFERENCES "ejercicio_usuario"("id")   ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sesion_ejercicios" ADD CONSTRAINT "sesion_ejercicios_catalogo_ejercicio_id_fkey" FOREIGN KEY ("catalogo_ejercicio_id") REFERENCES "catalogo_ejercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sesion_series"     ADD CONSTRAINT "sesion_series_sesion_ejercicio_id_fkey"       FOREIGN KEY ("sesion_ejercicio_id")   REFERENCES "sesion_ejercicios"("id")   ON DELETE CASCADE  ON UPDATE CASCADE;
