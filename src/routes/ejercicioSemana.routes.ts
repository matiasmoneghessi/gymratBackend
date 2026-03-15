import { Router } from 'express';
import { EjercicioSemanaController } from '../controllers/ejercicioSemana.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const ejercicioSemanaController = new EjercicioSemanaController();

router.get('/', supabaseAuthMiddleware, (req, res, next) => ejercicioSemanaController.getAll(req, res, next));
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => ejercicioSemanaController.getById(req, res, next));

export default router;
