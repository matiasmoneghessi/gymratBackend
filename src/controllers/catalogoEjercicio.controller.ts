import { Request, Response, NextFunction } from 'express';
import { CatalogoEjercicioService } from '../services/catalogoEjercicio.service';
import { AppError } from '../middleware/errorHandler';

const catalogoService = new CatalogoEjercicioService();

export class CatalogoEjercicioController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await catalogoService.getAll();
      res.json({ success: true, data });
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

      const data = await catalogoService.getById(id);
      if (!data) {
        const error: AppError = new Error('Ejercicio de catálogo no encontrado');
        error.statusCode = 404;
        throw error;
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre } = req.body;
      if (!nombre || typeof nombre !== 'string') {
        const error: AppError = new Error('El campo nombre es requerido');
        error.statusCode = 400;
        throw error;
      }

      const data = await catalogoService.create(nombre.trim());
      res.status(201).json({ success: true, data });
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

      await catalogoService.delete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
