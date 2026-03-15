import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  logger.error(`Error ${statusCode}: ${message}`, {
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && { error: err }),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const error: AppError = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
