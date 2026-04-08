import { Response, NextFunction } from 'express';
import { SesionService } from '../services/sesion.service';
import { UsuarioService } from '../services/usuario.service';
import { StravaService } from '../services/strava.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

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
      logger.info(`POST /api/sesiones - sync_strava: ${JSON.stringify(sync_strava)} (${typeof sync_strava})`);

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

      // Responder al cliente inmediatamente sin esperar a Strava
      res.status(201).json({ success: true, data: sesion });

      // Sincronizar con Strava en background (no bloquea la respuesta)
      if (sync_strava === true || sync_strava === 'true' || sync_strava === 1) {
        logger.info(`Sincronizando sesión ${sesion.id_sesion} con Strava para usuario ${usuario.id_usuario}`);
        stravaService
          .createActivityForSession(usuario.id_usuario, {
            rutinaId,
            semanaId,
            diaId,
            fecha,
            duracion_minutos,
          })
          .then((activity) => {
            if (activity) logger.info(`Strava activity creada: ${activity.activityId}`);
            else logger.info(`Strava: usuario sin token conectado`);
          })
          .catch((err: unknown) => {
            logger.info(`Strava error (sesión ya guardada): ${err instanceof Error ? err.message : String(err)}`);
          });
      }
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
