import { Router } from 'express';
import { SesionController } from '../controllers/sesion.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const controller = new SesionController();

// GET  /sesiones   → historial de sesiones del usuario autenticado
// POST /sesiones   → registrar nueva sesión
router.get('/', supabaseAuthMiddleware, (req, res, next) => controller.getAll(req as any, res, next));
router.post('/', supabaseAuthMiddleware, (req, res, next) => controller.create(req as any, res, next));

export default router;
