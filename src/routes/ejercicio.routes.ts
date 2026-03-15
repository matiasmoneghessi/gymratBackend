import { Router } from 'express';
import { EjercicioController } from '../controllers/ejercicio.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const ejercicioController = new EjercicioController();

router.get('/', supabaseAuthMiddleware, (req, res, next) => ejercicioController.getAll(req, res, next));
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => ejercicioController.getById(req, res, next));

export default router;
