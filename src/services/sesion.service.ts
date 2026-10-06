import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export interface CreateSesionInput {
  rutinaId: number;
  semanaId: number;
  diaId: number;
  fecha: string;
  duracion_minutos: number;
  ejercicios: { ejercicioId: number; completado: boolean; series: unknown[] }[];
}

export interface SesionSerieResumen {
  numero_serie: number;
  kg: number | null;
  reps: number;
  completada: boolean;
}

export interface SesionEjercicioResumen {
  catalogoEjercicioId: number;
  nombre: string;
  completado: boolean;
  series: SesionSerieResumen[];
}

export interface SesionResumen {
  id: number;
  rutinaId: number;
  rutinaNombre: string;
  semanaNumero: number;
  diaNombre: string;
  fecha: string;
  duracion_minutos: number;
  totalEjercicios: number;
  ejerciciosCompletados: number;
  ejercicios: SesionEjercicioResumen[];
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseSeries(series: unknown[]): SesionSerieResumen[] {
  const byNumero = new Map<number, SesionSerieResumen>();
  (Array.isArray(series) ? series : []).forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const serie = raw as Record<string, unknown>;
    const numero = toNumberOrNull(serie.numero_serie);
    const numero_serie = numero !== null && Number.isInteger(numero) && numero > 0 ? numero : idx + 1;
    const reps = toNumberOrNull(serie.reps);
    byNumero.set(numero_serie, {
      numero_serie,
      kg: toNumberOrNull(serie.kg),
      reps: reps !== null ? Math.round(reps) : 0,
      completada: serie.completada === true,
    });
  });
  return [...byNumero.values()].sort((a, b) => a.numero_serie - b.numero_serie);
}

export class SesionService {
  async create(usuarioId: number, input: CreateSesionInput): Promise<{ id: number }> {
    const totalEjercicios = input.ejercicios.length;
    const ejerciciosCompletados = input.ejercicios.filter((e) => e.completado).length;

    // Resolver catalogo_ejercicio_id de cada ejercicio (solo ejercicios de rutinas del usuario)
    const ejercicioIds = [...new Set(input.ejercicios.map((e) => Number(e.ejercicioId)).filter(Number.isInteger))];
    const ejerciciosRutina = ejercicioIds.length
      ? await prisma.ejercicioUsuario.findMany({
          where: {
            id: { in: ejercicioIds },
            dia: { semana: { rutina: { usuarioId } } },
          },
          select: { id: true, catalogoEjercicioId: true },
        })
      : [];
    const catalogoIdByEjercicioId = new Map(ejerciciosRutina.map((e) => [e.id, e.catalogoEjercicioId]));

    const ejerciciosData = input.ejercicios.flatMap((e, idx) => {
      const catalogoEjercicioId = catalogoIdByEjercicioId.get(Number(e.ejercicioId));
      if (catalogoEjercicioId === undefined) {
        logger.info(
          `POST /api/sesiones - ejercicioId ${e.ejercicioId} no encontrado para usuario ${usuarioId}, se omite detalle`,
        );
        return [];
      }
      return [
        {
          ejercicioId: Number(e.ejercicioId),
          catalogoEjercicioId,
          orden: idx,
          completado: e.completado === true,
          series: { create: parseSeries(e.series) },
        },
      ];
    });

    const sesion = await prisma.sesion.create({
      data: {
        usuarioId,
        rutinaId: input.rutinaId,
        semanaId: input.semanaId,
        diaId: input.diaId,
        fecha: new Date(input.fecha),
        duracion_minutos: input.duracion_minutos,
        total_ejercicios: totalEjercicios,
        ejercicios_completados: ejerciciosCompletados,
        ejercicios: { create: ejerciciosData },
      },
    });

    return { id: sesion.id };
  }

  async deleteById(sesionId: number, usuarioId: number): Promise<void> {
    const sesion = await prisma.sesion.findUnique({ where: { id: sesionId } });
    if (!sesion || sesion.usuarioId !== usuarioId) {
      const error: Error & { statusCode?: number } = new Error('Sesión no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await prisma.sesion.delete({ where: { id: sesionId } });
  }

  async getByUsuario(usuarioId: number): Promise<SesionResumen[]> {
    const sesiones = await prisma.sesion.findMany({
      where: { usuarioId },
      include: {
        rutina: { select: { nombre: true } },
        semana: { select: { numero: true } },
        dia: { select: { nombre: true } },
        ejercicios: {
          orderBy: { orden: 'asc' },
          include: {
            catalogoEjercicio: { select: { id: true, nombre: true } },
            series: { orderBy: { numero_serie: 'asc' } },
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return sesiones.map((s) => ({
      id: s.id,
      rutinaId: s.rutinaId,
      rutinaNombre: s.rutina.nombre,
      semanaNumero: s.semana.numero,
      diaNombre: s.dia.nombre,
      fecha: s.fecha.toISOString().split('T')[0],
      duracion_minutos: s.duracion_minutos,
      totalEjercicios: s.total_ejercicios,
      ejerciciosCompletados: s.ejercicios_completados,
      ejercicios: s.ejercicios.map((e) => ({
        catalogoEjercicioId: e.catalogoEjercicio.id,
        nombre: e.catalogoEjercicio.nombre,
        completado: e.completado,
        series: e.series.map((serie) => ({
          numero_serie: serie.numero_serie,
          kg: serie.kg,
          reps: serie.reps,
          completada: serie.completada,
        })),
      })),
    }));
  }
}
