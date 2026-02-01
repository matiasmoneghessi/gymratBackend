import { Request, Response, NextFunction } from 'express';
import { EjercicioSemanaService } from '../services/ejercicioSemana.service';
import { AppError } from '../middleware/errorHandler';

const ejercicioSemanaService = new EjercicioSemanaService();

export class EjercicioSemanaController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const ejercicioId = req.query.ejercicioId
        ? parseInt(req.query.ejercicioId as string)
        : undefined;
      const semanaId = req.query.semanaId
        ? parseInt(req.query.semanaId as string)
        : undefined;

      if (req.query.ejercicioId && isNaN(ejercicioId!)) {
        const error: AppError = new Error('ejercicioId inválido');
        error.statusCode = 400;
        throw error;
      }

      if (req.query.semanaId && isNaN(semanaId!)) {
        const error: AppError = new Error('semanaId inválido');
        error.statusCode = 400;
        throw error;
      }

      const ejercicioSemanas = await ejercicioSemanaService.getAll(
        ejercicioId,
        semanaId
      );
      res.json({
        success: true,
        data: ejercicioSemanas,
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

      const ejercicioSemana = await ejercicioSemanaService.getById(id);
      if (!ejercicioSemana) {
        const error: AppError = new Error('EjercicioSemana no encontrado');
        error.statusCode = 404;
        throw error;
      }

      res.json({
        success: true,
        data: ejercicioSemana,
      });
    } catch (error) {
      next(error);
    }
  }
}
