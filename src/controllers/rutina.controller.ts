import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { RutinaService } from '../services/rutina.service';
import type { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const rutinaService = new RutinaService();

const ejercicioSemanaSchema = z.object({
  semanaNumero: z.coerce.number().int().min(1).max(52),
  kg: z.coerce.number().min(0).max(9999).nullable(),
  reps: z.coerce.number().int().min(0).max(9999),
  series: z.coerce.number().int().min(0).max(99),
  tipo_reps: z.enum(['reps', 'seg']).default('reps'),
});

const ejercicioSchema = z.object({
  nombre: z.string().min(1).max(200),
  codigo: z.string().max(20).nullable().optional(),
  ejercicioSemanas: z.array(ejercicioSemanaSchema).min(1).max(52),
});

const diaSchema = z.object({
  nombre: z.string().min(1).max(200),
  movilidad: z.string().max(500).nullable().optional(),
  activacion: z.string().max(500).nullable().optional(),
  ejercicios: z.array(ejercicioSchema).min(1).max(50),
});

const semanaSchema = z.object({
  nombre: z.string().min(1).max(200),
  tipo_esfuerzo: z.string().min(1).max(100),
  dias: z.array(diaSchema).min(1).max(14),
});

const rutinaBodySchema = z.object({
  nombre: z.string().min(1).max(200),
  semanas: z.array(semanaSchema).min(1).max(52),
});

function parseRutinaBody(body: unknown) {
  const result = rutinaBodySchema.safeParse(body);
  if (!result.success) {
    const error: AppError = new Error(
      `Datos inválidos: ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
    error.statusCode = 400;
    throw error;
  }
  return result.data;
}

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

      const data = parseRutinaBody(req.body);

      const rutina = await rutinaService.create(data, req.supabaseUser);

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

      const data = parseRutinaBody(req.body);

      const rutina = await rutinaService.update(id, data, req.supabaseUser);
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
