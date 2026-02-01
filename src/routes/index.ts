import { Router } from 'express';
import semanaRoutes from './semana.routes';
import diaRoutes from './dia.routes';
import ejercicioRoutes from './ejercicio.routes';
import ejercicioSemanaRoutes from './ejercicioSemana.routes';

const router = Router();

router.use('/semanas', semanaRoutes);
router.use('/dias', diaRoutes);
router.use('/ejercicios', ejercicioRoutes);
router.use('/ejercicio-semana', ejercicioSemanaRoutes);

export default router;
