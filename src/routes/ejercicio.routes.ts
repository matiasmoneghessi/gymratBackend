import { Router } from 'express';
import { EjercicioController } from '../controllers/ejercicio.controller';

const router = Router();
const ejercicioController = new EjercicioController();

router.get('/', (req, res, next) => ejercicioController.getAll(req, res, next));
router.get('/:id', (req, res, next) => ejercicioController.getById(req, res, next));

export default router;
