# GymRat - Backend API

Backend para aplicación de rutina de gimnasio desarrollado con Node.js, TypeScript, Express, Prisma y PostgreSQL.

## Estructura del Proyecto

```
gymrat/
├── src/
│   ├── controllers/        # Controladores para manejar requests
│   ├── routes/            # Rutas de la API
│   ├── services/          # Lógica de negocio
│   ├── middleware/        # Middlewares personalizados
│   ├── utils/             # Utilidades
│   ├── app.ts             # Configuración de Express
│   └── server.ts          # Punto de entrada
├── prisma/
│   ├── schema.prisma      # Esquema de Prisma con los modelos
│   └── migrations/        # Migraciones (generadas automáticamente)
└── ...
```

## Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL (v14 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio (si aplica)

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
   - Crear un archivo `.env` en la raíz del proyecto
   - Copiar el contenido de `.env.example` y ajustar los valores:
   ```
   DATABASE_URL="postgresql://usuario:password@localhost:5432/gymrat?schema=public"
   PORT=3000
   NODE_ENV=development
   ```

   **Supabase (red IPv4):** Si usas Supabase y aparece "Not IPv4 compatible" o el error P1001, en el panel de Supabase (Connect to your project) cambia **Method** de "Direct connection" a **"Session pooler"**. Copia la nueva connection string (puerto 6543, host `*.pooler.supabase.com`), sustituye `[YOUR-PASSWORD]` por tu contraseña y añade al final: `?pgbouncer=true&connection_limit=1`. Usa esa URL como `DATABASE_URL` en `.env`. Configurá también `DIRECT_URL` al mismo host y puerto 6543 (no 5432) y `directUrl` en `schema.prisma`.

   **Si `npx prisma migrate deploy` se cuelga:** Con el pooler (IPv4) Prisma no puede ejecutar migraciones (necesita conexión directa). Aplicá el schema a mano: en Supabase → SQL Editor, abrí el archivo `prisma/supabase-apply-schema.sql`, copiá todo el contenido, pegálo en una nueva query y ejecutá. Eso crea/actualiza las tablas para que coincidan con el schema de Prisma.

4. Generar el cliente de Prisma:
```bash
npm run prisma:generate
```

5. Ejecutar las migraciones:
```bash
npm run prisma:migrate
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia el servidor en producción (requiere build previo)
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:migrate` - Ejecuta las migraciones de la base de datos
- `npm run prisma:studio` - Abre Prisma Studio para visualizar la base de datos

## Endpoints de la API

### Semanas
- `GET /api/semanas` - Listar todas las semanas
- `GET /api/semanas/:id` - Obtener semana por ID

### Días
- `GET /api/dias` - Listar todos los días
- `GET /api/dias?semanaId=1` - Listar días filtrados por semana
- `GET /api/dias/:id` - Obtener día por ID con ejercicios

### Ejercicios
- `GET /api/ejercicios` - Listar todos los ejercicios
- `GET /api/ejercicios?diaId=1` - Listar ejercicios filtrados por día
- `GET /api/ejercicios/:id` - Obtener ejercicio por ID con variaciones semanales

### Ejercicio-Semana
- `GET /api/ejercicio-semana` - Listar todas las relaciones
- `GET /api/ejercicio-semana?ejercicioId=1` - Filtrar por ejercicio
- `GET /api/ejercicio-semana?semanaId=1` - Filtrar por semana
- `GET /api/ejercicio-semana/:id` - Obtener relación por ID

### Health Check
- `GET /health` - Verificar estado del servidor

## Modelo de Datos

El esquema de la base de datos incluye:

- **Semana**: Representa cada semana del ciclo de entrenamiento
- **Dia**: Representa cada día de entrenamiento (pertenece a una semana)
- **Ejercicio**: Representa cada ejercicio de la rutina (pertenece a un día)
- **EjercicioSemana**: Relación que almacena los parámetros específicos (KG, REPS, SERIES) de cada ejercicio por semana

## Desarrollo

El servidor se ejecuta en el puerto 3000 por defecto (configurable mediante la variable de entorno `PORT`).

En modo desarrollo, el servidor se reinicia automáticamente cuando se detectan cambios en los archivos TypeScript.

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **TypeScript** - Lenguaje de programación
- **Express.js** - Framework web
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
