import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RutinaController } from '../controllers/rutina.controller';
import { ImportarController } from '../controllers/importar.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const rutinaController = new RutinaController();
const importarController = new ImportarController();

// Rate limit estricto para share y token endpoints
const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { message: 'Demasiadas solicitudes de compartir. Intenta más tarde.' } },
});

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: { message: 'Demasiadas solicitudes. Intenta más tarde.' } },
});

// POST /rutinas/importar  → procesa contenido de archivo con IA y devuelve JSON de rutina
router.post('/importar', supabaseAuthMiddleware, (req, res, next) =>
  importarController.parsearRutina(req as any, res, next),
);

router.get('/', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.list(req, res, next),
);

router.post('/', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.create(req, res, next),
);

router.get('/compartir/:token', tokenLimiter, (req, res, next) =>
  rutinaController.getByToken(req, res, next),
);

router.post('/compartir/:token/clonar', supabaseAuthMiddleware, tokenLimiter, (req, res, next) =>
  rutinaController.cloneFromToken(req, res, next),
);

router.get('/:id', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.getById(req, res, next),
);

router.put('/:id', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.update(req, res, next),
);

router.delete('/:id', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.delete(req, res, next),
);

router.post('/:id/share', supabaseAuthMiddleware, shareLimiter, (req, res, next) =>
  rutinaController.share(req, res, next),
);

export default router;
