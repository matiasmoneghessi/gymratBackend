import { Request, Response, NextFunction } from 'express';
import { DiaService } from '../services/dia.service';
import { AppError } from '../middleware/errorHandler';

const diaService = new DiaService();

export class DiaController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const semanaId = req.query.semanaId
        ? parseInt(req.query.semanaId as string)
        : undefined;

      if (req.query.semanaId && isNaN(semanaId!)) {
        const error: AppError = new Error('semanaId inválido');
        error.statusCode = 400;
        throw error;
      }

      const dias = await diaService.getAll(semanaId);
      res.json({
        success: true,
        data: dias,
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

      const dia = await diaService.getById(id);
      if (!dia) {
        const error: AppError = new Error('Día no encontrado');
        error.statusCode = 404;
        throw error;
      }

      res.json({
        success: true,
        data: dia,
      });
    } catch (error) {
      next(error);
    }
  }
}
