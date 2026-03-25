import { Response, NextFunction } from 'express';
import { SesionService } from '../services/sesion.service';
import { UsuarioService } from '../services/usuario.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const sesionService = new SesionService();
const usuarioService = new UsuarioService();

export class SesionController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);

      const { rutinaId, semanaId, diaId, fecha, duracion_minutos, ejercicios } = req.body;

      if (!rutinaId || !semanaId || !diaId || !fecha || duracion_minutos == null) {
        const error: AppError = new Error('Faltan campos requeridos: rutinaId, semanaId, diaId, fecha, duracion_minutos');
        error.statusCode = 400;
        throw error;
      }

      const data = await sesionService.create(usuario.id_usuario, {
        rutinaId,
        semanaId,
        diaId,
        fecha,
        duracion_minutos,
        ejercicios: ejercicios ?? [],
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);
      const data = await sesionService.getByUsuario(usuario.id_usuario);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
