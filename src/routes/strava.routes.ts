import { Router } from 'express';
import { StravaController } from '../controllers/strava.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const controller = new StravaController();

// GET  /api/strava/connect-url → devuelve la URL de OAuth de Strava
// GET  /api/strava/callback    → Strava redirige aquí tras autorizar (sin Bearer token)
// GET  /api/strava/status      → si el usuario tiene Strava conectado
// DELETE /api/strava/disconnect → desvincula la cuenta de Strava

router.get('/connect-url', supabaseAuthMiddleware, (req, res, next) =>
  controller.getConnectUrl(req as any, res, next),
);
router.get('/callback', (req, res, next) => controller.callback(req as any, res, next));
router.get('/status', supabaseAuthMiddleware, (req, res, next) =>
  controller.status(req as any, res, next),
);
router.delete('/disconnect', supabaseAuthMiddleware, (req, res, next) =>
  controller.disconnect(req as any, res, next),
);

export default router;
