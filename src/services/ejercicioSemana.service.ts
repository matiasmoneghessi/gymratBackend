import prisma from '../utils/prisma';
import { EjercicioSemana } from '@prisma/client';

export class EjercicioSemanaService {
  async getAll(ejercicioId?: number, semanaId?: number): Promise<EjercicioSemana[]> {
    const where: any = {};
    if (ejercicioId) where.ejercicioId = ejercicioId;
    if (semanaId) where.semanaId = semanaId;

    return prisma.ejercicioSemana.findMany({
      where,
      include: {
        ejercicio: {
          include: {
            dia: {
              include: {
                semana: true,
              },
            },
          },
        },
        semana: true,
      },
      orderBy: [
        { semana: { numero: 'asc' } },
        { ejercicio: { codigo: 'asc' } },
      ],
    });
  }

  async getById(id: number): Promise<EjercicioSemana | null> {
    return prisma.ejercicioSemana.findUnique({
      where: { id },
      include: {
        ejercicio: {
          include: {
            dia: {
              include: {
                semana: true,
              },
            },
          },
        },
        semana: true,
      },
    });
  }
}
