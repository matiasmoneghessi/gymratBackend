import prisma from '../utils/prisma';
import { UsuarioService } from './usuario.service';
import type { User } from '@supabase/supabase-js';

export interface CreateEjercicioSemanaInput {
  semanaNumero: number;
  kg: number | null;
  reps: number;
  series: number;
  tipo_reps: string;
}

export interface CreateEjercicioInput {
  nombre: string;
  codigo?: string | null;
  ejercicioSemanas: CreateEjercicioSemanaInput[];
}

export interface CreateDiaInput {
  nombre: string;
  movilidad?: string | null;
  activacion?: string | null;
  ejercicios: CreateEjercicioInput[];
}

export interface CreateSemanaInput {
  nombre: string;
  tipo_esfuerzo: string;
  dias: CreateDiaInput[];
}

export interface CreateRutinaInput {
  nombre: string;
  semanas: CreateSemanaInput[];
}

const usuarioService = new UsuarioService();

function computeMaxKg(kg: number | null, serieDetalles: { kg: number | null }[]): number | null {
  const kgsFromSeries = serieDetalles.map((s) => s.kg).filter((k): k is number => k !== null);
  if (kgsFromSeries.length === 0) return kg;
  return Math.max(...kgsFromSeries);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addMaxKgToRutina(rutina: any): any {
  return {
    ...rutina,
    semanas: rutina.semanas.map((semana: any) => ({
      ...semana,
      dias: semana.dias.map((dia: any) => ({
        ...dia,
        ejercicios: dia.ejercicios.map((ejercicio: any) => ({
          ...ejercicio,
          ejercicioSemanas: ejercicio.ejercicioSemanas.map(({ serieDetalles, ...es }: any) => ({
            ...es,
            maxKg: computeMaxKg(es.kg, serieDetalles ?? []),
          })),
        })),
      })),
    })),
  };
}

export class RutinaService {
  async getByUsuarioId(supabaseUser: User) {
    const usuario = await usuarioService.getOrCreateFromSupabaseUser(supabaseUser);

    return prisma.rutina.findMany({
      where: { usuarioId: usuario.id_usuario },
      select: { id: true, nombre: true },
      orderBy: { id: 'desc' },
    });
  }

  async getById(id: number, supabaseUser: User) {
    const usuario = await usuarioService.getOrCreateFromSupabaseUser(supabaseUser);

    const rutina = await prisma.rutina.findUnique({
      where: { id },
      include: {
        semanas: {
          orderBy: { numero: 'asc' },
          include: {
            dias: {
              orderBy: { numero: 'asc' },
              include: {
                ejercicios: {
                  include: {
                    ejercicioSemanas: {
                      orderBy: { semanaId: 'asc' },
                      include: {
                        serieDetalles: {
                          orderBy: { numero_serie: 'asc' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!rutina || rutina.usuarioId !== usuario.id_usuario) {
      return null;
    }

    return addMaxKgToRutina(rutina);
  }

  async create(data: CreateRutinaInput, supabaseUser: User) {
    const usuario = await usuarioService.getOrCreateFromSupabaseUser(supabaseUser);

    // 1. Crear rutina con semanas, días y ejercicios (nested)
    const rutina = await prisma.rutina.create({
      data: {
        nombre: data.nombre,
        usuarioId: usuario.id_usuario,
        semanas: {
          create: data.semanas.map((semana, semanaIdx) => ({
            numero: semanaIdx + 1,
            nombre: semana.nombre,
            tipo_esfuerzo: semana.tipo_esfuerzo,
            dias: {
              create: semana.dias.map((dia, diaIdx) => ({
                numero: diaIdx + 1,
                nombre: dia.nombre,
                movilidad: dia.movilidad || null,
                activacion: dia.activacion || null,
                ejercicios: {
                  create: dia.ejercicios.map((ej) => ({
                    nombre: ej.nombre,
                    codigo: ej.codigo || null,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        semanas: {
          orderBy: { numero: 'asc' },
          include: {
            dias: {
              orderBy: { numero: 'asc' },
              include: {
                ejercicios: true,
              },
            },
          },
        },
      },
    });

    // 2. Crear EjercicioSemanas (requiere IDs ya creados)
    const semanaIdByNumero = new Map<number, number>();
    for (const semana of rutina.semanas) {
      semanaIdByNumero.set(semana.numero, semana.id);
    }

    const ejercicioSemanaData: {
      ejercicioId: number;
      semanaId: number;
      kg: number | null;
      reps: number;
      series: number;
      tipo_reps: string;
    }[] = [];

    for (const semana of rutina.semanas) {
      for (const dia of semana.dias) {
        const semanaInput = data.semanas[semana.numero - 1];
        const diaInput = semanaInput.dias[dia.numero - 1];

        for (let ejIdx = 0; ejIdx < dia.ejercicios.length; ejIdx++) {
          const ejercicio = dia.ejercicios[ejIdx];
          const ejInput = diaInput.ejercicios[ejIdx];

          if (ejInput.ejercicioSemanas) {
            for (const es of ejInput.ejercicioSemanas) {
              const semanaId = semanaIdByNumero.get(es.semanaNumero);
              if (semanaId) {
                ejercicioSemanaData.push({
                  ejercicioId: ejercicio.id,
                  semanaId,
                  kg: es.kg,
                  reps: es.reps,
                  series: es.series,
                  tipo_reps: es.tipo_reps ?? 'reps',
                });
              }
            }
          }
        }
      }
    }

    if (ejercicioSemanaData.length > 0) {
      await prisma.ejercicioSemana.createMany({
        data: ejercicioSemanaData,
      });
    }

    const rutinaId = rutina.id;

    // 3. Retornar rutina completa (fuera de la transacción para evitar P2028)
    return prisma.rutina.findUnique({
      where: { id: rutinaId },
      include: {
        semanas: {
          orderBy: { numero: 'asc' },
          include: {
            dias: {
              orderBy: { numero: 'asc' },
              include: {
                ejercicios: {
                  include: {
                    ejercicioSemanas: {
                      orderBy: { semanaId: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, data: CreateRutinaInput, supabaseUser: User) {
    const usuario = await usuarioService.getOrCreateFromSupabaseUser(supabaseUser);

    const existing = await prisma.rutina.findUnique({
      where: { id },
      select: { usuarioId: true },
    });

    if (!existing || existing.usuarioId !== usuario.id_usuario) {
      return null;
    }

    // Actualizar nombre
    await prisma.rutina.update({
      where: { id },
      data: { nombre: data.nombre },
    });

    // Borrar semanas (cascada elimina dias, ejercicios, ejercicioSemanas)
    await prisma.semana.deleteMany({ where: { rutinaId: id } });

    // Recrear semanas con la nueva estructura
    for (let sIdx = 0; sIdx < data.semanas.length; sIdx++) {
      const semanaInput = data.semanas[sIdx];
      const semana = await prisma.semana.create({
        data: {
          rutinaId: id,
          numero: sIdx + 1,
          nombre: semanaInput.nombre,
          tipo_esfuerzo: semanaInput.tipo_esfuerzo,
        },
      });

      for (let dIdx = 0; dIdx < semanaInput.dias.length; dIdx++) {
        const diaInput = semanaInput.dias[dIdx];
        const dia = await prisma.dia.create({
          data: {
            semanaId: semana.id,
            numero: dIdx + 1,
            nombre: diaInput.nombre,
            movilidad: diaInput.movilidad || null,
            activacion: diaInput.activacion || null,
          },
        });

        for (const ejInput of diaInput.ejercicios) {
          const ejercicio = await prisma.ejercicioUsuario.create({
            data: {
              diaId: dia.id,
              nombre: ejInput.nombre,
              codigo: ejInput.codigo || null,
            },
          });

          if (ejInput.ejercicioSemanas && ejInput.ejercicioSemanas.length > 0) {
            // Obtener IDs de semanas creadas en esta rutina
            const semanasCreadas = await prisma.semana.findMany({
              where: { rutinaId: id },
              select: { id: true, numero: true },
            });
            const semanaIdByNumero = new Map(semanasCreadas.map((s) => [s.numero, s.id]));

            const esData = ejInput.ejercicioSemanas
              .map((es) => {
                const semanaId = semanaIdByNumero.get(es.semanaNumero);
                if (!semanaId) return null;
                return { ejercicioId: ejercicio.id, semanaId, kg: es.kg, reps: es.reps, series: es.series, tipo_reps: es.tipo_reps ?? 'reps' };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);

            if (esData.length > 0) {
              await prisma.ejercicioSemana.createMany({ data: esData });
            }
          }
        }
      }
    }

    return prisma.rutina.findUnique({
      where: { id },
      include: {
        semanas: {
          orderBy: { numero: 'asc' },
          include: {
            dias: {
              orderBy: { numero: 'asc' },
              include: {
                ejercicios: {
                  include: { ejercicioSemanas: { orderBy: { semanaId: 'asc' } } },
                },
              },
            },
          },
        },
      },
    });
  }

  async delete(id: number, supabaseUser: User) {
    const usuario = await usuarioService.getOrCreateFromSupabaseUser(supabaseUser);

    const rutina = await prisma.rutina.findUnique({
      where: { id },
      select: { usuarioId: true },
    });

    if (!rutina || rutina.usuarioId !== usuario.id_usuario) {
      return null;
    }

    await prisma.rutina.delete({ where: { id } });
    return true;
  }

  async createShareToken(rutinaId: number, supabaseUser: User) {
    const usuario = await usuarioService.getOrCreateFromSupabaseUser(supabaseUser);

    const rutina = await prisma.rutina.findUnique({
      where: { id: rutinaId },
      select: { usuarioId: true },
    });

    if (!rutina || rutina.usuarioId !== usuario.id_usuario) {
      return null;
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const shareToken = await prisma.shareToken.create({
      data: { rutinaId, expiresAt },
    });

    return shareToken.token;
  }

  private async fetchRutinaRawByToken(token: string) {
    const shareToken = await prisma.shareToken.findUnique({
      where: { token },
      include: {
        rutina: {
          include: {
            semanas: {
              orderBy: { numero: 'asc' },
              include: {
                dias: {
                  orderBy: { numero: 'asc' },
                  include: {
                    ejercicios: {
                      include: {
                        ejercicioSemanas: {
                          orderBy: { semanaId: 'asc' },
                          include: {
                            serieDetalles: {
                              orderBy: { numero_serie: 'asc' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shareToken || shareToken.expiresAt < new Date()) {
      return null;
    }

    return shareToken.rutina;
  }

  async getRutinaByToken(token: string) {
    const rutina = await this.fetchRutinaRawByToken(token);
    if (!rutina) return null;
    return addMaxKgToRutina(rutina);
  }

  async cloneFromToken(token: string, supabaseUser: User) {
    const rutina = await this.fetchRutinaRawByToken(token);
    if (!rutina) return null;

    const usuario = await usuarioService.getOrCreateFromSupabaseUser(supabaseUser);

    const nueva = await prisma.rutina.create({
      data: {
        nombre: rutina.nombre,
        usuarioId: usuario.id_usuario,
        semanas: {
          create: rutina.semanas.map((semana) => ({
            numero: semana.numero,
            nombre: semana.nombre,
            tipo_esfuerzo: semana.tipo_esfuerzo,
            dias: {
              create: semana.dias.map((dia) => ({
                numero: dia.numero,
                nombre: dia.nombre,
                movilidad: dia.movilidad,
                activacion: dia.activacion,
                ejercicios: {
                  create: dia.ejercicios.map((ej) => ({
                    nombre: ej.nombre,
                    codigo: ej.codigo,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        semanas: {
          orderBy: { numero: 'asc' },
          include: {
            dias: {
              orderBy: { numero: 'asc' },
              include: { ejercicios: true },
            },
          },
        },
      },
    });

    // Recrear ejercicioSemanas con los nuevos IDs
    const semanaNumeroToNewId = new Map(nueva.semanas.map((s) => [s.numero, s.id]));
    const semanaOrigIdToNumero = new Map(rutina.semanas.map((s) => [s.id, s.numero]));
    const ejercicioSemanaData: {
      ejercicioId: number;
      semanaId: number;
      kg: number | null;
      reps: number;
      series: number;
      tipo_reps: string;
    }[] = [];

    for (let sIdx = 0; sIdx < rutina.semanas.length; sIdx++) {
      const semanaOrig = rutina.semanas[sIdx];
      const semanaNew = nueva.semanas[sIdx];
      for (let dIdx = 0; dIdx < semanaOrig.dias.length; dIdx++) {
        const diaOrig = semanaOrig.dias[dIdx];
        const diaNew = semanaNew.dias[dIdx];
        for (let eIdx = 0; eIdx < diaOrig.ejercicios.length; eIdx++) {
          const ejOrig = diaOrig.ejercicios[eIdx];
          const ejNew = diaNew.ejercicios[eIdx];
          for (const es of ejOrig.ejercicioSemanas) {
            const semanaNumero = semanaOrigIdToNumero.get(es.semanaId);
            const newSemanaId = semanaNumero ? semanaNumeroToNewId.get(semanaNumero) : undefined;
            if (newSemanaId) {
              ejercicioSemanaData.push({
                ejercicioId: ejNew.id,
                semanaId: newSemanaId,
                kg: es.kg,
                reps: es.reps,
                series: es.series,
                tipo_reps: es.tipo_reps ?? 'reps',
              });
            }
          }
        }
      }
    }

    if (ejercicioSemanaData.length > 0) {
      await prisma.ejercicioSemana.createMany({ data: ejercicioSemanaData });
    }

    return prisma.rutina.findUnique({
      where: { id: nueva.id },
      include: {
        semanas: {
          orderBy: { numero: 'asc' },
          include: {
            dias: {
              orderBy: { numero: 'asc' },
              include: {
                ejercicios: {
                  include: { ejercicioSemanas: { orderBy: { semanaId: 'asc' } } },
                },
              },
            },
          },
        },
      },
    });
  }
}
