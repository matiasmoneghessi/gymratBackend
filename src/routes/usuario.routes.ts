import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const usuarioController = new UsuarioController();

router.get('/me', supabaseAuthMiddleware, (req, res, next) =>
  usuarioController.getCurrent(req, res, next),
);
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => usuarioController.getById(req, res, next));

export default router;
