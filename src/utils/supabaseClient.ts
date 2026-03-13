import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  logger.warn(
    '[Supabase] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas. La autenticación con JWT no funcionará hasta que las completes en el .env del backend.',
  );
}

export const supabaseAdmin = createClient(supabaseUrl ?? '', supabaseServiceRoleKey ?? '', {
  auth: {
    persistSession: false,
  },
});

