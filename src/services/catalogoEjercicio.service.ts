import prisma from '../utils/prisma';
import { CatalogoEjercicio } from '@prisma/client';

export class CatalogoEjercicioService {
  async getAll(): Promise<CatalogoEjercicio[]> {
    return prisma.catalogoEjercicio.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async getById(id: number): Promise<CatalogoEjercicio | null> {
    return prisma.catalogoEjercicio.findUnique({ where: { id } });
  }

  async create(nombre: string): Promise<CatalogoEjercicio> {
    return prisma.catalogoEjercicio.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  async delete(id: number): Promise<CatalogoEjercicio> {
    return prisma.catalogoEjercicio.delete({ where: { id } });
  }
}
