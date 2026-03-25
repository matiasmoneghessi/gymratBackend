import prisma from '../utils/prisma';
import { EjercicioUsuario } from '@prisma/client';

export class EjercicioUsuarioService {
  async getAll(diaId?: number): Promise<EjercicioUsuario[]> {
    const where = diaId ? { diaId } : {};
    return prisma.ejercicioUsuario.findMany({
      where,
      include: {
        dia: {
          include: {
            semana: true,
          },
        },
        catalogoEjercicio: true,
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

  async getByRutinaId(rutinaId: number): Promise<EjercicioUsuario[]> {
    return prisma.ejercicioUsuario.findMany({
      where: {
        dia: {
          semana: {
            rutinaId,
          },
        },
      },
      include: {
        dia: {
          include: {
            semana: true,
          },
        },
        catalogoEjercicio: true,
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

  async getById(id: number): Promise<EjercicioUsuario | null> {
    return prisma.ejercicioUsuario.findUnique({
      where: { id },
      include: {
        dia: {
          include: {
            semana: true,
          },
        },
        catalogoEjercicio: true,
        ejercicioSemanas: {
          include: {
            semana: true,
            serieDetalles: {
              orderBy: { numero_serie: 'asc' },
            },
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
