import type { User } from '@supabase/supabase-js';
import prisma from '../utils/prisma';

export type UsuarioSafe = {
  id_usuario: number;
  usuario: string;
  nombre: string;
  nivel: number;
  email: string;
  telefono: string | null;
};

export class UsuarioService {
  async getById(id: number): Promise<UsuarioSafe | null> {
    const u = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true,
        usuario: true,
        nombre: true,
        nivel: true,
        email: true,
        telefono: true,
      },
    });
    return u;
  }

  async getOrCreateFromSupabaseUser(user: User): Promise<UsuarioSafe> {
    const email = user.email;
    const supabaseUserId = user.id;
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      email ||
      'Sin nombre';

    if (!email) {
      const error = new Error('El proveedor OAuth no devolvió un email.');
      throw error;
    }

    // 1. Buscar por supabaseUserId si ya está enlazado
    const existingBySupabase = await prisma.usuario.findUnique({
      where: { supabaseUserId },
      select: {
        id_usuario: true,
        usuario: true,
        nombre: true,
        nivel: true,
        email: true,
        telefono: true,
      },
    });

    if (existingBySupabase) {
      return existingBySupabase;
    }

    // 2. Buscar por email para enlazar cuentas previas
    const existingByEmail = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id_usuario: true,
        usuario: true,
        nombre: true,
        nivel: true,
        email: true,
        telefono: true,
      },
    });

    if (existingByEmail) {
      const updated = await prisma.usuario.update({
        where: { id_usuario: existingByEmail.id_usuario },
        data: {
          supabaseUserId,
        },
        select: {
          id_usuario: true,
          usuario: true,
          nombre: true,
          nivel: true,
          email: true,
          telefono: true,
        },
      });

      return updated;
    }

    // 3. Crear un nuevo usuario a partir de los datos de Supabase
    const created = await prisma.usuario.create({
      data: {
        supabaseUserId,
        email,
        nombre: fullName,
        usuario: email,
        nivel: 1,
        password: null,
        telefono: null,
      },
      select: {
        id_usuario: true,
        usuario: true,
        nombre: true,
        nivel: true,
        email: true,
        telefono: true,
      },
    });

    return created;
  }
}
