import { Router } from 'express';
import { EjercicioSemanaController } from '../controllers/ejercicioSemana.controller';

const router = Router();
const ejercicioSemanaController = new EjercicioSemanaController();

router.get('/', (req, res, next) => ejercicioSemanaController.getAll(req, res, next));
router.get('/:id', (req, res, next) => ejercicioSemanaController.getById(req, res, next));

export default router;
