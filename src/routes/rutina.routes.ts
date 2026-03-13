import { Router } from 'express';
import { RutinaController } from '../controllers/rutina.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const rutinaController = new RutinaController();

router.get('/', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.list(req, res, next),
);

router.post('/', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.create(req, res, next),
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

// Share por token (el GET es público, el POST para clonar requiere auth)
router.post('/:id/share', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.share(req, res, next),
);

router.get('/compartir/:token', (req, res, next) =>
  rutinaController.getByToken(req, res, next),
);

router.post('/compartir/:token/clonar', supabaseAuthMiddleware, (req, res, next) =>
  rutinaController.cloneFromToken(req, res, next),
);

export default router;
