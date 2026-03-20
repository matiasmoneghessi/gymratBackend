import prisma from '../utils/prisma';
import { CatalogoEjercicio } from '@prisma/client';

export interface CreateCatalogoEjercicioInput {
  nombre: string;
  descripcion?: string;
  video?: string;
  imagen?: string;
}

export class CatalogoEjercicioService {
  async getAll(): Promise<CatalogoEjercicio[]> {
    return prisma.catalogoEjercicio.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async getById(id: number): Promise<CatalogoEjercicio | null> {
    return prisma.catalogoEjercicio.findUnique({ where: { id } });
  }

  async create(input: CreateCatalogoEjercicioInput): Promise<CatalogoEjercicio> {
    return prisma.catalogoEjercicio.upsert({
      where: { nombre: input.nombre },
      update: {
        descripcion: input.descripcion ?? undefined,
        video: input.video ?? undefined,
        imagen: input.imagen ?? undefined,
      },
      create: {
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
        video: input.video ?? null,
        imagen: input.imagen ?? null,
      },
    });
  }

  async update(id: number, input: Partial<CreateCatalogoEjercicioInput>): Promise<CatalogoEjercicio> {
    return prisma.catalogoEjercicio.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: number): Promise<CatalogoEjercicio> {
    return prisma.catalogoEjercicio.delete({ where: { id } });
  }
}
