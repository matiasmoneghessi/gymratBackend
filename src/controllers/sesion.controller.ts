import { Response, NextFunction } from 'express';
import { SesionService } from '../services/sesion.service';
import { UsuarioService } from '../services/usuario.service';
import { StravaService } from '../services/strava.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const sesionService = new SesionService();
const usuarioService = new UsuarioService();
const stravaService = new StravaService();

export class SesionController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);

      const { rutinaId, semanaId, diaId, fecha, duracion_minutos, ejercicios, sync_strava } = req.body;

      if (!rutinaId || !semanaId || !diaId || !fecha || duracion_minutos == null) {
        const error: AppError = new Error('Faltan campos requeridos: rutinaId, semanaId, diaId, fecha, duracion_minutos');
        error.statusCode = 400;
        throw error;
      }

      const sesion = await sesionService.create(usuario.id_usuario, {
        rutinaId,
        semanaId,
        diaId,
        fecha,
        duracion_minutos,
        ejercicios: ejercicios ?? [],
      });

      let stravaActivity: { activityId: number; activityUrl: string } | null = null;

      if (sync_strava === true) {
        try {
          stravaActivity = await stravaService.createActivityForSession(usuario.id_usuario, {
            rutinaId,
            semanaId,
            diaId,
            fecha,
            duracion_minutos,
          });
        } catch {
          // El error de Strava no bloquea la sesión
        }
      }

      res.status(201).json({
        success: true,
        data: {
          ...sesion,
          ...(stravaActivity ? { strava: stravaActivity } : {}),
        },
      });
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

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);
      const sesionId = Number(req.params.id);

      await sesionService.deleteById(sesionId, usuario.id_usuario);

      res.json({ success: true });
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
