import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import routes from './routes';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();

// Security headers
app.use(helmet());

// CORS - solo orígenes permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin(origin, callback) {
      // Permitir requests sin origin (mobile apps, curl, health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('No permitido por CORS'));
    },
    credentials: true,
  }),
);

// Rate limiting global
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { message: 'Demasiadas solicitudes. Intenta más tarde.' } },
  }),
);

// Middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logger de requests
app.use((req, _, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api', routes);

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
