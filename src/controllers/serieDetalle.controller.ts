import { Request, Response, NextFunction } from 'express';
import { SerieDetalleService } from '../services/serieDetalle.service';
import { AppError } from '../middleware/errorHandler';

const serieDetalleService = new SerieDetalleService();

export class SerieDetalleController {
  async getByEjercicioSemana(req: Request, res: Response, next: NextFunction) {
    try {
      const ejercicioSemanaId = parseInt(req.params.ejercicioSemanaId);
      if (isNaN(ejercicioSemanaId)) {
        const error: AppError = new Error('ejercicioSemanaId inválido');
        error.statusCode = 400;
        throw error;
      }

      const data = await serieDetalleService.getByEjercicioSemana(ejercicioSemanaId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Reemplaza todas las series de un ejercicioSemana de una sola vez.
  // Body: { series: [{ numero_serie, kg?, reps? }, ...] }
  // El primer elemento actúa como default (refleja el kg base de EjercicioSemana).
  async upsertMany(req: Request, res: Response, next: NextFunction) {
    try {
      const ejercicioSemanaId = parseInt(req.params.ejercicioSemanaId);
      if (isNaN(ejercicioSemanaId)) {
        const error: AppError = new Error('ejercicioSemanaId inválido');
        error.statusCode = 400;
        throw error;
      }

      const { series } = req.body;
      if (!Array.isArray(series) || series.length === 0) {
        const error: AppError = new Error('El campo series debe ser un array no vacío');
        error.statusCode = 400;
        throw error;
      }

      const data = await serieDetalleService.upsertMany(ejercicioSemanaId, series);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        const error: AppError = new Error('ID inválido');
        error.statusCode = 400;
        throw error;
      }

      await serieDetalleService.delete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
