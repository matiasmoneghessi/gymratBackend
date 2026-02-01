import { Request, Response, NextFunction } from 'express';
import { SemanaService } from '../services/semana.service';
import { AppError } from '../middleware/errorHandler';

const semanaService = new SemanaService();

export class SemanaController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const semanas = await semanaService.getAll();
      res.json({
        success: true,
        data: semanas,
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

      const semana = await semanaService.getById(id);
      if (!semana) {
        const error: AppError = new Error('Semana no encontrada');
        error.statusCode = 404;
        throw error;
      }

      res.json({
        success: true,
        data: semana,
      });
    } catch (error) {
      next(error);
    }
  }
}
