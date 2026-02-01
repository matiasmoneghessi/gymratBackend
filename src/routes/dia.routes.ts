import { Router } from 'express';
import { DiaController } from '../controllers/dia.controller';

const router = Router();
const diaController = new DiaController();

router.get('/', (req, res, next) => diaController.getAll(req, res, next));
router.get('/:id', (req, res, next) => diaController.getById(req, res, next));

export default router;
