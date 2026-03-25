import { Router } from 'express';
import { EjercicioSemanaController } from '../controllers/ejercicioSemana.controller';
import { SerieDetalleController } from '../controllers/serieDetalle.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const ejercicioSemanaController = new EjercicioSemanaController();
const serieDetalleController = new SerieDetalleController();

router.get('/', supabaseAuthMiddleware, (req, res, next) => ejercicioSemanaController.getAll(req, res, next));
router.get('/:id', supabaseAuthMiddleware, (req, res, next) => ejercicioSemanaController.getById(req, res, next));

// PUT /ejercicio-semanas/:id/serie-detalles → normaliza body { detalles } → { series } y delega
router.put('/:ejercicioSemanaId/serie-detalles', supabaseAuthMiddleware, (req, res, next) => {
  if (req.body.detalles && !req.body.series) {
    req.body.series = req.body.detalles;
  }
  serieDetalleController.upsertMany(req, res, next);
});

export default router;
