import prisma from '../utils/prisma';
import { Semana } from '@prisma/client';

export class SemanaService {
  async getAll(): Promise<Semana[]> {
    return prisma.semana.findMany({
      orderBy: { numero: 'asc' },
    });
  }

  async getById(id: number): Promise<Semana | null> {
    return prisma.semana.findUnique({
      where: { id },
      include: {
        dias: {
          include: {
            ejercicios: {
              include: {
                ejercicioSemanas: true,
              },
            },
          },
        },
      },
    });
  }

  async getByNumero(numero: number): Promise<Semana | null> {
    return prisma.semana.findFirst({
      where: { numero },
    });
  }
}
