import type { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../utils/supabaseClient';
import type { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  supabaseUser?: User;
}

export const supabaseAuthMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: AppError = new Error('No autenticado. Falta el token de acceso.');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.substring('Bearer '.length).trim();

    if (!token) {
      const error: AppError = new Error('No autenticado. Token vacío.');
      error.statusCode = 401;
      throw error;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      const authError: AppError = new Error('Token inválido o expirado.');
      authError.statusCode = 401;
      throw authError;
    }

    req.supabaseUser = data.user;
    next();
  } catch (err) {
    next(err);
  }
};

