import { Router } from 'express';
import { SemanaController } from '../controllers/semana.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const semanaController = new SemanaController();

router.get('/', supabaseAuthMiddleware, (req, res, next) => semanaController.getAll(req, res, next));
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => semanaController.getById(req, res, next));

export default router;
