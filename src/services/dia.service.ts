import prisma from '../utils/prisma';
import { Dia } from '@prisma/client';

export class DiaService {
  async getAll(semanaId?: number): Promise<Dia[]> {
    const where = semanaId ? { semanaId } : {};
    return prisma.dia.findMany({
      where,
      include: {
        semana: true,
        ejercicios: {
          include: {
            ejercicioSemanas: {
              include: {
                semana: true,
              },
            },
          },
          orderBy: { codigo: 'asc' },
        },
      },
      orderBy: { numero: 'asc' },
    });
  }

  async getById(id: number): Promise<Dia | null> {
    return prisma.dia.findUnique({
      where: { id },
      include: {
        semana: true,
        ejercicios: {
          include: {
            ejercicioSemanas: {
              include: {
                semana: true,
              },
            },
          },
          orderBy: { codigo: 'asc' },
        },
      },
    });
  }
}
