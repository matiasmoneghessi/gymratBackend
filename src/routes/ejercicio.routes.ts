import { Router } from 'express';
import { EjercicioUsuarioController } from '../controllers/ejercicioUsuario.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const ejercicioUsuarioController = new EjercicioUsuarioController();

router.get('/', supabaseAuthMiddleware, (req, res, next) => ejercicioUsuarioController.getAll(req, res, next));
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => ejercicioUsuarioController.getById(req, res, next));

export default router;
