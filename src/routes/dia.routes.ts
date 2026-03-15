import { Router } from 'express';
import { DiaController } from '../controllers/dia.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const diaController = new DiaController();

router.get('/', supabaseAuthMiddleware, (req, res, next) => diaController.getAll(req, res, next));
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => diaController.getById(req, res, next));

export default router;
