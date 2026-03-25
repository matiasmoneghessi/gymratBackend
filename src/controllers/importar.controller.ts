import { Response, NextFunction } from 'express';
import { ImportarService } from '../services/importar.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';

const importarService = new ImportarService();

export class ImportarController {
  async parsearRutina(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { contenido, fileName } = req.body;

      if (!contenido || typeof contenido !== 'string') {
        const error: AppError = new Error('Falta el campo "contenido" con el texto del archivo.');
        error.statusCode = 400;
        throw error;
      }

      if (contenido.trim().length < 10) {
        const error: AppError = new Error('El contenido del archivo está vacío o es demasiado corto.');
        error.statusCode = 400;
        throw error;
      }

      const rutina = await importarService.parsearRutina(contenido, fileName ?? 'archivo');
      res.json({ success: true, data: rutina });
    } catch (error: any) {
      if (!error.statusCode) error.statusCode = 500;
      next(error);
    }
  }
}
