import prisma from '../utils/prisma';

export interface CreateSesionInput {
  rutinaId: number;
  semanaId: number;
  diaId: number;
  fecha: string;
  duracion_minutos: number;
  ejercicios: { ejercicioId: number; completado: boolean; series: unknown[] }[];
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
}

export class SesionService {
  async create(usuarioId: number, input: CreateSesionInput): Promise<{ id: number }> {
    const totalEjercicios = input.ejercicios.length;
    const ejerciciosCompletados = input.ejercicios.filter((e) => e.completado).length;

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
    }));
  }
}
