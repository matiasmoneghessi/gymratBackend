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
