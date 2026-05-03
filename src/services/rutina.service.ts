import prisma from '../utils/prisma';
import { UsuarioService } from './usuario.service';
import type { User } from '@supabase/supabase-js';
import type { Prisma } from '@prisma/client';

export interface CreateEjercicioSemanaInput {
  semanaNumero: number;
  kg: number | null;
  reps: number;
  series: number;
  tipo_reps: string;
}

export interface CreateEjercicioInput {
  catalogoEjercicioId: number;
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

type RutinaWithSemanasYDias = Prisma.RutinaGetPayload<{
  include: {
    semanas: {
      include: {
        dias: {
          include: {
            ejercicios: true;
          };
        };
      };
    };
  };
}>;

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
                    catalogoEjercicio: true,
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
    const rutina: RutinaWithSemanasYDias = await prisma.rutina.create({
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
                    catalogoEjercicioId: ej.catalogoEjercicioId,
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

    await prisma.$transaction(async (tx) => {
      await tx.rutina.update({
        where: { id },
        data: { nombre: data.nombre },
      });

      const semanasExistentes = await tx.semana.findMany({
        where: { rutinaId: id },
        include: {
          dias: {
            include: {
              ejercicios: {
                include: {
                  ejercicioSemanas: true,
                },
              },
            },
            orderBy: { numero: 'asc' },
          },
        },
        orderBy: { numero: 'asc' },
      });

      const semanaExistenteByNumero = new Map(semanasExistentes.map((s) => [s.numero, s]));
      const semanaNumerosEntrantes = new Set(data.semanas.map((_, idx) => idx + 1));
      const semanasRemovidas = semanasExistentes.filter((s) => !semanaNumerosEntrantes.has(s.numero));

      if (semanasRemovidas.length > 0) {
        await tx.sesion.deleteMany({
          where: {
            rutinaId: id,
            semanaId: { in: semanasRemovidas.map((s) => s.id) },
          },
        });
        await tx.semana.deleteMany({
          where: { id: { in: semanasRemovidas.map((s) => s.id) } },
        });
      }

      for (let sIdx = 0; sIdx < data.semanas.length; sIdx++) {
        const numero = sIdx + 1;
        const semanaInput = data.semanas[sIdx];
        const semanaExistente = semanaExistenteByNumero.get(numero);

        if (semanaExistente) {
          await tx.semana.update({
            where: { id: semanaExistente.id },
            data: {
              nombre: semanaInput.nombre,
              tipo_esfuerzo: semanaInput.tipo_esfuerzo,
            },
          });
        } else {
          await tx.semana.create({
            data: {
              rutinaId: id,
              numero,
              nombre: semanaInput.nombre,
              tipo_esfuerzo: semanaInput.tipo_esfuerzo,
            },
          });
        }
      }

      const semanasActuales = await tx.semana.findMany({
        where: { rutinaId: id },
        include: {
          dias: {
            include: {
              ejercicios: {
                include: {
                  ejercicioSemanas: true,
                },
              },
            },
            orderBy: { numero: 'asc' },
          },
        },
        orderBy: { numero: 'asc' },
      });
      const semanaActualByNumero = new Map(semanasActuales.map((s) => [s.numero, s]));
      const semanaIdByNumero = new Map(semanasActuales.map((s) => [s.numero, s.id]));

      for (let sIdx = 0; sIdx < data.semanas.length; sIdx++) {
        const semanaNumero = sIdx + 1;
        const semanaInput = data.semanas[sIdx];
        const semanaActual = semanaActualByNumero.get(semanaNumero);
        if (!semanaActual) continue;

        const diaExistenteByNumero = new Map(semanaActual.dias.map((d) => [d.numero, d]));
        const diaNumerosEntrantes = new Set(semanaInput.dias.map((_, idx) => idx + 1));
        const diasRemovidos = semanaActual.dias.filter((d) => !diaNumerosEntrantes.has(d.numero));

        if (diasRemovidos.length > 0) {
          await tx.sesion.deleteMany({
            where: {
              rutinaId: id,
              diaId: { in: diasRemovidos.map((d) => d.id) },
            },
          });
          await tx.dia.deleteMany({
            where: { id: { in: diasRemovidos.map((d) => d.id) } },
          });
        }

        for (let dIdx = 0; dIdx < semanaInput.dias.length; dIdx++) {
          const diaNumero = dIdx + 1;
          const diaInput = semanaInput.dias[dIdx];
          const diaExistente = diaExistenteByNumero.get(diaNumero);

          let diaId: number;
          let ejerciciosExistentes = diaExistente?.ejercicios ?? [];

          if (diaExistente) {
            const diaActualizado = await tx.dia.update({
              where: { id: diaExistente.id },
              data: {
                nombre: diaInput.nombre,
                movilidad: diaInput.movilidad || null,
                activacion: diaInput.activacion || null,
              },
              include: {
                ejercicios: {
                  include: { ejercicioSemanas: true },
                },
              },
            });
            diaId = diaActualizado.id;
            ejerciciosExistentes = diaActualizado.ejercicios;
          } else {
            const diaCreado = await tx.dia.create({
              data: {
                semanaId: semanaActual.id,
                numero: diaNumero,
                nombre: diaInput.nombre,
                movilidad: diaInput.movilidad || null,
                activacion: diaInput.activacion || null,
              },
            });
            diaId = diaCreado.id;
            ejerciciosExistentes = [];
          }

          for (let eIdx = 0; eIdx < diaInput.ejercicios.length; eIdx++) {
            const ejInput = diaInput.ejercicios[eIdx];
            const ejercicioExistente = ejerciciosExistentes[eIdx];

            const ejercicio = ejercicioExistente
              ? await tx.ejercicioUsuario.update({
                  where: { id: ejercicioExistente.id },
                  data: {
                    catalogoEjercicioId: ejInput.catalogoEjercicioId,
                    codigo: ejInput.codigo || null,
                  },
                })
              : await tx.ejercicioUsuario.create({
                  data: {
                    diaId,
                    catalogoEjercicioId: ejInput.catalogoEjercicioId,
                    codigo: ejInput.codigo || null,
                  },
                });

            const semanaIdsEntrantes = ejInput.ejercicioSemanas
              .map((es) => semanaIdByNumero.get(es.semanaNumero))
              .filter((semanaId): semanaId is number => !!semanaId);

            for (const es of ejInput.ejercicioSemanas) {
              const semanaId = semanaIdByNumero.get(es.semanaNumero);
              if (!semanaId) continue;

              await tx.ejercicioSemana.upsert({
                where: {
                  ejercicioId_semanaId: {
                    ejercicioId: ejercicio.id,
                    semanaId,
                  },
                },
                update: {
                  kg: es.kg,
                  reps: es.reps,
                  series: es.series,
                  tipo_reps: es.tipo_reps ?? 'reps',
                },
                create: {
                  ejercicioId: ejercicio.id,
                  semanaId,
                  kg: es.kg,
                  reps: es.reps,
                  series: es.series,
                  tipo_reps: es.tipo_reps ?? 'reps',
                },
              });
            }

            if (semanaIdsEntrantes.length > 0) {
              await tx.ejercicioSemana.deleteMany({
                where: {
                  ejercicioId: ejercicio.id,
                  semanaId: { notIn: semanaIdsEntrantes },
                },
              });
            } else {
              await tx.ejercicioSemana.deleteMany({
                where: { ejercicioId: ejercicio.id },
              });
            }
          }

          const ejerciciosRemovidos = ejerciciosExistentes.slice(diaInput.ejercicios.length);
          if (ejerciciosRemovidos.length > 0) {
            await tx.ejercicioUsuario.deleteMany({
              where: { id: { in: ejerciciosRemovidos.map((e) => e.id) } },
            });
          }
        }
      }
    });

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
                        catalogoEjercicio: true,
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

    const nueva: RutinaWithSemanasYDias = await prisma.rutina.create({
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
                    catalogoEjercicioId: ej.catalogoEjercicioId,
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
