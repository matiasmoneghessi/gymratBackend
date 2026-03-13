import { Router } from 'express';
import { SemanaController } from '../controllers/semana.controller';

const router = Router();
const semanaController = new SemanaController();

router.get('/', (req, res, next) => semanaController.getAll(req, res, next));
router.get('/:id', (req, res, next) => semanaController.getById(req, res, next));

export default router;
