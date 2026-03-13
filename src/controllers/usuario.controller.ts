import type { Request, Response, NextFunction } from 'express';
import { UsuarioService } from '../services/usuario.service';
import type { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const usuarioService = new UsuarioService();

export class UsuarioController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        const error: AppError = new Error('ID inválido');
        error.statusCode = 400;
        throw error;
      }

      const usuario = await usuarioService.getById(id);
      if (!usuario) {
        const error: AppError = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
      }

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }
}
