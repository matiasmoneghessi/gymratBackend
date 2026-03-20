import prisma from '../utils/prisma';
import { SerieDetalle } from '@prisma/client';

export interface UpsertSerieDetalleInput {
  numero_serie: number;
  kg?: number | null;
  reps?: number | null;
}

export class SerieDetalleService {
  async getByEjercicioSemana(ejercicioSemanaId: number): Promise<SerieDetalle[]> {
    return prisma.serieDetalle.findMany({
      where: { ejercicioSemanaId },
      orderBy: { numero_serie: 'asc' },
    });
  }

  async upsertMany(ejercicioSemanaId: number, series: UpsertSerieDetalleInput[]): Promise<SerieDetalle[]> {
    await prisma.serieDetalle.deleteMany({ where: { ejercicioSemanaId } });

    await prisma.serieDetalle.createMany({
      data: series.map((s) => ({
        ejercicioSemanaId,
        numero_serie: s.numero_serie,
        kg: s.kg ?? null,
        reps: s.reps ?? null,
      })),
    });

    return this.getByEjercicioSemana(ejercicioSemanaId);
  }

  async delete(id: number): Promise<SerieDetalle> {
    return prisma.serieDetalle.delete({ where: { id } });
  }
}
