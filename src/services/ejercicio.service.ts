import prisma from '../utils/prisma';
import { Ejercicio } from '@prisma/client';

export class EjercicioService {
  async getAll(diaId?: number): Promise<Ejercicio[]> {
    const where = diaId ? { diaId } : {};
    return prisma.ejercicio.findMany({
      where,
      include: {
        dia: {
          include: {
            semana: true,
          },
        },
        ejercicioSemanas: {
          include: {
            semana: true,
          },
          orderBy: {
            semana: {
              numero: 'asc',
            },
          },
        },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  async getById(id: number): Promise<Ejercicio | null> {
    return prisma.ejercicio.findUnique({
      where: { id },
      include: {
        dia: {
          include: {
            semana: true,
          },
        },
        ejercicioSemanas: {
          include: {
            semana: true,
          },
          orderBy: {
            semana: {
              numero: 'asc',
            },
          },
        },
      },
    });
  }
}
