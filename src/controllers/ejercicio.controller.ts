import { Request, Response, NextFunction } from 'express';
import { EjercicioService } from '../services/ejercicio.service';
import { AppError } from '../middleware/errorHandler';

const ejercicioService = new EjercicioService();

export class EjercicioController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const diaId = req.query.diaId
        ? parseInt(req.query.diaId as string)
        : undefined;

      if (req.query.diaId && isNaN(diaId!)) {
        const error: AppError = new Error('diaId inválido');
        error.statusCode = 400;
        throw error;
      }

      const ejercicios = await ejercicioService.getAll(diaId);
      res.json({
        success: true,
        data: ejercicios,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        const error: AppError = new Error('ID inválido');
        error.statusCode = 400;
        throw error;
      }

      const ejercicio = await ejercicioService.getById(id);
      if (!ejercicio) {
        const error: AppError = new Error('Ejercicio no encontrado');
        error.statusCode = 404;
        throw error;
      }

      res.json({
        success: true,
        data: ejercicio,
      });
    } catch (error) {
      next(error);
    }
  }
}
