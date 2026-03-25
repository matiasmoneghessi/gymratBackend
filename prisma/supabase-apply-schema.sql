-- Script para aplicar el schema de Prisma en Supabase cuando migrate deploy se cuelga (pooler IPv4).
-- Ejecutá todo este archivo en: Supabase → SQL Editor → New query → Pegar → Run.
-- ATENCIÓN: Borra las tablas existentes. Hacé backup si tenés datos.

-- Eliminar tablas en orden por FKs
DROP TABLE IF EXISTS "sesiones" CASCADE;
DROP TABLE IF EXISTS "serie_detalles" CASCADE;
DROP TABLE IF EXISTS "ejercicio_semanas" CASCADE;
DROP TABLE IF EXISTS "ejercicio_usuario" CASCADE;
DROP TABLE IF EXISTS "catalogo_ejercicios" CASCADE;
DROP TABLE IF EXISTS "dias" CASCADE;
DROP TABLE IF EXISTS "semanas" CASCADE;
DROP TABLE IF EXISTS "share_tokens" CASCADE;
DROP TABLE IF EXISTS "rutinas" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;

-- Crear tablas en orden
CREATE TABLE "catalogo_ejercicios" (
  "id"          SERIAL NOT NULL,
  "nombre"      TEXT   NOT NULL,
  "descripcion" TEXT,
  "video"       TEXT,
  "imagen"      TEXT,

  CONSTRAINT "catalogo_ejercicios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usuarios" (
  "id_usuario"       SERIAL  NOT NULL,
  "usuario"          TEXT    NOT NULL,
  "password"         TEXT,
  "nombre"           TEXT    NOT NULL,
  "nivel"            INTEGER NOT NULL,
  "email"            TEXT    NOT NULL,
  "telefono"         TEXT,
  "supabase_user_id" TEXT,

  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

CREATE TABLE "rutinas" (
  "id"         SERIAL  NOT NULL,
  "nombre"     TEXT    NOT NULL,
  "usuario_id" INTEGER NOT NULL,

  CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "share_tokens" (
  "id"         SERIAL       NOT NULL,
  "token"      TEXT         NOT NULL,
  "rutina_id"  INTEGER      NOT NULL,
  "expires_at" TIMESTAMPTZ  NOT NULL,
  "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "share_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "semanas" (
  "id"            SERIAL  NOT NULL,
  "numero"        INTEGER NOT NULL,
  "tipo_esfuerzo" TEXT    NOT NULL,
  "nombre"        TEXT    NOT NULL,
  "rutina_id"     INTEGER NOT NULL,

  CONSTRAINT "semanas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dias" (
  "id"         SERIAL  NOT NULL,
  "numero"     INTEGER NOT NULL,
  "nombre"     TEXT    NOT NULL,
  "movilidad"  TEXT,
  "activacion" TEXT,
  "semana_id"  INTEGER NOT NULL,

  CONSTRAINT "dias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ejercicio_usuario" (
  "id"                    SERIAL  NOT NULL,
  "nombre"                TEXT    NOT NULL,
  "codigo"                TEXT,
  "dia_id"                INTEGER NOT NULL,
  "catalogo_ejercicio_id" INTEGER,

  CONSTRAINT "ejercicio_usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ejercicio_semanas" (
  "id"           SERIAL           NOT NULL,
  "ejercicio_id" INTEGER          NOT NULL,
  "semana_id"    INTEGER          NOT NULL,
  "kg"           DOUBLE PRECISION,
  "reps"         INTEGER          NOT NULL,
  "series"       INTEGER          NOT NULL,
  "tipo_reps"    TEXT             NOT NULL DEFAULT 'reps',

  CONSTRAINT "ejercicio_semanas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "serie_detalles" (
  "id"                  SERIAL           NOT NULL,
  "ejercicio_semana_id" INTEGER          NOT NULL,
  "numero_serie"        INTEGER          NOT NULL,
  "kg"                  DOUBLE PRECISION,
  "reps"                INTEGER,

  CONSTRAINT "serie_detalles_pkey" PRIMARY KEY ("id")
);

-- Índices únicos
CREATE UNIQUE INDEX "catalogo_ejercicios_nombre_key"            ON "catalogo_ejercicios"("nombre");
CREATE UNIQUE INDEX "usuarios_usuario_key"                      ON "usuarios"("usuario");
CREATE UNIQUE INDEX "usuarios_email_key"                        ON "usuarios"("email");
CREATE UNIQUE INDEX "usuarios_supabase_user_id_key"             ON "usuarios"("supabase_user_id");
CREATE UNIQUE INDEX "share_tokens_token_key"                    ON "share_tokens"("token");
CREATE UNIQUE INDEX "semanas_rutina_id_numero_key"              ON "semanas"("rutina_id", "numero");
CREATE UNIQUE INDEX "dias_semana_id_numero_key"                 ON "dias"("semana_id", "numero");
CREATE UNIQUE INDEX "ejercicio_semanas_ejercicio_id_semana_id_key" ON "ejercicio_semanas"("ejercicio_id", "semana_id");
CREATE UNIQUE INDEX "serie_detalles_ejercicio_semana_id_numero_serie_key" ON "serie_detalles"("ejercicio_semana_id", "numero_serie");

CREATE TABLE "sesiones" (
  "id"                     SERIAL       NOT NULL,
  "usuario_id"             INTEGER      NOT NULL,
  "rutina_id"              INTEGER      NOT NULL,
  "semana_id"              INTEGER      NOT NULL,
  "dia_id"                 INTEGER      NOT NULL,
  "fecha"                  DATE         NOT NULL,
  "duracion_minutos"       INTEGER      NOT NULL,
  "total_ejercicios"       INTEGER      NOT NULL DEFAULT 0,
  "ejercicios_completados" INTEGER      NOT NULL DEFAULT 0,

  CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "rutinas"          ADD CONSTRAINT "rutinas_usuario_id_fkey"                       FOREIGN KEY ("usuario_id")             REFERENCES "usuarios"("id_usuario")        ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "share_tokens"     ADD CONSTRAINT "share_tokens_rutina_id_fkey"                   FOREIGN KEY ("rutina_id")              REFERENCES "rutinas"("id")                 ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "semanas"          ADD CONSTRAINT "semanas_rutina_id_fkey"                        FOREIGN KEY ("rutina_id")              REFERENCES "rutinas"("id")                 ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "dias"             ADD CONSTRAINT "dias_semana_id_fkey"                           FOREIGN KEY ("semana_id")              REFERENCES "semanas"("id")                 ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "ejercicio_usuario" ADD CONSTRAINT "ejercicio_usuario_dia_id_fkey"                FOREIGN KEY ("dia_id")                 REFERENCES "dias"("id")                    ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "ejercicio_usuario" ADD CONSTRAINT "ejercicio_usuario_catalogo_ejercicio_id_fkey" FOREIGN KEY ("catalogo_ejercicio_id")  REFERENCES "catalogo_ejercicios"("id")     ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ejercicio_semanas" ADD CONSTRAINT "ejercicio_semanas_ejercicio_id_fkey"          FOREIGN KEY ("ejercicio_id")           REFERENCES "ejercicio_usuario"("id")       ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "ejercicio_semanas" ADD CONSTRAINT "ejercicio_semanas_semana_id_fkey"             FOREIGN KEY ("semana_id")              REFERENCES "semanas"("id")                 ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "serie_detalles"   ADD CONSTRAINT "serie_detalles_ejercicio_semana_id_fkey"       FOREIGN KEY ("ejercicio_semana_id")    REFERENCES "ejercicio_semanas"("id")       ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "sesiones"         ADD CONSTRAINT "sesiones_usuario_id_fkey"                    FOREIGN KEY ("usuario_id")             REFERENCES "usuarios"("id_usuario")        ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "sesiones"         ADD CONSTRAINT "sesiones_rutina_id_fkey"                     FOREIGN KEY ("rutina_id")              REFERENCES "rutinas"("id")                 ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "sesiones"         ADD CONSTRAINT "sesiones_semana_id_fkey"                     FOREIGN KEY ("semana_id")              REFERENCES "semanas"("id")                 ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "sesiones"         ADD CONSTRAINT "sesiones_dia_id_fkey"                        FOREIGN KEY ("dia_id")                 REFERENCES "dias"("id")                    ON DELETE CASCADE  ON UPDATE CASCADE;
