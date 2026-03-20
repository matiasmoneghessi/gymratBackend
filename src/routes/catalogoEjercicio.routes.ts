import { Router } from 'express';
import { CatalogoEjercicioController } from '../controllers/catalogoEjercicio.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const controller = new CatalogoEjercicioController();

router.get('/', supabaseAuthMiddleware, (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => controller.getById(req, res, next));
router.post('/', supabaseAuthMiddleware, (req, res, next) => controller.create(req, res, next));
router.put('/:id', supabaseAuthMiddleware, (req, res, next) => controller.update(req, res, next));
router.delete('/:id', supabaseAuthMiddleware, (req, res, next) => controller.delete(req, res, next));

export default router;
