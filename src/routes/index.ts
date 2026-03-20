import { Router } from 'express';
import semanaRoutes from './semana.routes';
import diaRoutes from './dia.routes';
import ejercicioRoutes from './ejercicio.routes';
import ejercicioSemanaRoutes from './ejercicioSemana.routes';
import usuarioRoutes from './usuario.routes';
import rutinaRoutes from './rutina.routes';
import catalogoEjercicioRoutes from './catalogoEjercicio.routes';

const router = Router();

router.use('/rutinas', rutinaRoutes);
router.use('/semanas', semanaRoutes);
router.use('/dias', diaRoutes);
router.use('/ejercicios', ejercicioRoutes);
router.use('/ejercicio-semana', ejercicioSemanaRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/catalogo-ejercicios', catalogoEjercicioRoutes);

export default router;
