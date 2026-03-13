import type { Response, NextFunction } from 'express';
import { RutinaService } from '../services/rutina.service';
import type { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const rutinaService = new RutinaService();

export class RutinaController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const rutinas = await rutinaService.getByUsuarioId(req.supabaseUser);

      res.json({ success: true, data: rutinas });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        const error: AppError = new Error('ID inválido');
        error.statusCode = 400;
        throw error;
      }

      const rutina = await rutinaService.getById(id, req.supabaseUser);
      if (!rutina) {
        const error: AppError = new Error('Rutina no encontrada');
        error.statusCode = 404;
        throw error;
      }

      res.json({ success: true, data: rutina });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const { nombre, semanas } = req.body;

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        const error: AppError = new Error('El nombre de la rutina es obligatorio');
        error.statusCode = 400;
        throw error;
      }

      if (!Array.isArray(semanas) || semanas.length === 0) {
        const error: AppError = new Error('La rutina debe tener al menos una semana');
        error.statusCode = 400;
        throw error;
      }

      const rutina = await rutinaService.create(
        { nombre: nombre.trim(), semanas },
        req.supabaseUser,
      );

      res.status(201).json({ success: true, data: rutina });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        const error: AppError = new Error('ID inválido');
        error.statusCode = 400;
        throw error;
      }

      const { nombre, semanas } = req.body;

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        const error: AppError = new Error('El nombre de la rutina es obligatorio');
        error.statusCode = 400;
        throw error;
      }

      if (!Array.isArray(semanas) || semanas.length === 0) {
        const error: AppError = new Error('La rutina debe tener al menos una semana');
        error.statusCode = 400;
        throw error;
      }

      const rutina = await rutinaService.update(id, { nombre: nombre.trim(), semanas }, req.supabaseUser);
      if (!rutina) {
        const error: AppError = new Error('Rutina no encontrada');
        error.statusCode = 404;
        throw error;
      }

      res.json({ success: true, data: rutina });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        const error: AppError = new Error('ID inválido');
        error.statusCode = 400;
        throw error;
      }

      const result = await rutinaService.delete(id, req.supabaseUser);
      if (!result) {
        const error: AppError = new Error('Rutina no encontrada');
        error.statusCode = 404;
        throw error;
      }

      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  }

  async share(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        const error: AppError = new Error('ID inválido');
        error.statusCode = 400;
        throw error;
      }

      const token = await rutinaService.createShareToken(id, req.supabaseUser);
      if (!token) {
        const error: AppError = new Error('Rutina no encontrada');
        error.statusCode = 404;
        throw error;
      }

      res.json({ success: true, data: { token } });
    } catch (error) {
      next(error);
    }
  }

  async getByToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const rutina = await rutinaService.getRutinaByToken(token);

      if (!rutina) {
        const error: AppError = new Error('Link inválido o expirado');
        error.statusCode = 404;
        throw error;
      }

      res.json({ success: true, data: rutina });
    } catch (error) {
      next(error);
    }
  }

  async cloneFromToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const { token } = req.params;
      const rutina = await rutinaService.cloneFromToken(token, req.supabaseUser);

      if (!rutina) {
        const error: AppError = new Error('Link inválido o expirado');
        error.statusCode = 404;
        throw error;
      }

      res.status(201).json({ success: true, data: rutina });
    } catch (error) {
      next(error);
    }
  }
}
