import { Response, NextFunction } from 'express';
import { StravaService } from '../services/strava.service';
import { UsuarioService } from '../services/usuario.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const stravaService = new StravaService();
const usuarioService = new UsuarioService();

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

export class StravaController {
  // GET /api/strava/connect-url
  // Devuelve la URL de autorización de Strava para que el frontend redirija al usuario.
  async getConnectUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);
      const url = stravaService.getConnectUrl(usuario.id_usuario);

      res.json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/strava/callback?code=XXX&state=<usuarioId>
  // Strava redirige aquí tras la autorización. No requiere Bearer token.
  async callback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, state, error: stravaError } = req.query as Record<string, string>;

      if (stravaError) {
        return res.redirect(`${FRONTEND_URL}/strava?error=access_denied`);
      }

      if (!code || !state) {
        return res.redirect(`${FRONTEND_URL}/strava?error=invalid_callback`);
      }

      const usuarioId = parseInt(state, 10);
      if (isNaN(usuarioId)) {
        return res.redirect(`${FRONTEND_URL}/strava?error=invalid_state`);
      }

      await stravaService.connectUser(usuarioId, code);

      return res.redirect(`${FRONTEND_URL}/strava?connected=true`);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/strava/disconnect
  async disconnect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);
      await stravaService.disconnectUser(usuario.id_usuario);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/strava/status
  async status(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.supabaseUser) {
        const error: AppError = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
      }

      const usuario = await usuarioService.getOrCreateFromSupabaseUser(req.supabaseUser);
      const data = await stravaService.getStatus(usuario.id_usuario);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
