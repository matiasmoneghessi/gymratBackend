import { Router } from 'express';
import { SerieDetalleController } from '../controllers/serieDetalle.controller';
import { supabaseAuthMiddleware } from '../middleware/auth';

const router = Router();
const controller = new SerieDetalleController();

// GET  /serie-detalles/:ejercicioSemanaId     → todas las series de un ejercicioSemana
// PUT  /serie-detalles/:ejercicioSemanaId     → reemplaza todas las series (upsert)
// DELETE /serie-detalles/:id                 → borra una serie puntual
router.get('/:ejercicioSemanaId', supabaseAuthMiddleware, (req, res, next) => controller.getByEjercicioSemana(req, res, next));
router.put('/:ejercicioSemanaId', supabaseAuthMiddleware, (req, res, next) => controller.upsertMany(req, res, next));
router.delete('/:id', supabaseAuthMiddleware, (req, res, next) => controller.delete(req, res, next));

export default router;
