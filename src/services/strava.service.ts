import prisma from '../utils/prisma';

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_URL = 'https://www.strava.com/api/v3';

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix timestamp en segundos
  athlete: { id: number };
}

export class StravaService {
  private clientId = process.env.STRAVA_CLIENT_ID!;
  private clientSecret = process.env.STRAVA_CLIENT_SECRET!;
  private redirectUri = process.env.STRAVA_REDIRECT_URI!;

  getConnectUrl(usuarioId: number): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'activity:write',
      state: String(usuarioId),
    });
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<StravaTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Strava token exchange failed: ${body}`);
    }

    return res.json() as Promise<StravaTokenResponse>;
  }

  async refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
    const refreshParams = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: refreshParams.toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Strava token refresh failed: ${body}`);
    }

    return res.json() as Promise<StravaTokenResponse>;
  }

  async connectUser(usuarioId: number, code: string): Promise<void> {
    const tokens = await this.exchangeCode(code);

    await prisma.usuario.update({
      where: { id_usuario: usuarioId },
      data: {
        stravaAthleteId: tokens.athlete.id,
        stravaAccessToken: tokens.access_token,
        stravaRefreshToken: tokens.refresh_token,
        stravaTokenExpiresAt: new Date(tokens.expires_at * 1000),
      },
    });
  }

  async disconnectUser(usuarioId: number): Promise<void> {
    await prisma.usuario.update({
      where: { id_usuario: usuarioId },
      data: {
        stravaAthleteId: null,
        stravaAccessToken: null,
        stravaRefreshToken: null,
        stravaTokenExpiresAt: null,
      },
    });
  }

  async getStatus(usuarioId: number): Promise<{ connected: boolean; athleteId?: number }> {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: usuarioId },
      select: { stravaAthleteId: true, stravaAccessToken: true },
    });

    const connected = !!usuario?.stravaAccessToken;
    return {
      connected,
      ...(connected && usuario?.stravaAthleteId ? { athleteId: usuario.stravaAthleteId } : {}),
    };
  }

  // Devuelve un access token válido, refrescando si es necesario. Null si no está conectado.
  private async getValidAccessToken(usuarioId: number): Promise<string | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: usuarioId },
      select: {
        stravaAccessToken: true,
        stravaRefreshToken: true,
        stravaTokenExpiresAt: true,
      },
    });

    if (!usuario?.stravaAccessToken || !usuario?.stravaRefreshToken) {
      return null;
    }

    const now = new Date();
    const expiresAt = usuario.stravaTokenExpiresAt;
    const isExpired = !expiresAt || expiresAt <= now;

    if (!isExpired) {
      return usuario.stravaAccessToken;
    }

    // Token expirado → refrescar
    const tokens = await this.refreshAccessToken(usuario.stravaRefreshToken);

    await prisma.usuario.update({
      where: { id_usuario: usuarioId },
      data: {
        stravaAccessToken: tokens.access_token,
        stravaRefreshToken: tokens.refresh_token,
        stravaTokenExpiresAt: new Date(tokens.expires_at * 1000),
      },
    });

    return tokens.access_token;
  }

  private buildDescription(ejercicios: { nombre: string; series: number; reps: number; kg: number | null; tipo_reps: string }[]): string {
    if (!ejercicios.length) return 'Sesión registrada desde GymRat';

    const lines = ejercicios.map((e) => {
      const peso = e.kg ? ` @ ${e.kg}kg` : '';
      const repsLabel = e.tipo_reps === 'time' ? `${e.reps}s` : `${e.reps} reps`;
      return `• ${e.nombre} — ${e.series}x${repsLabel}${peso}`;
    });

    return `Sesión registrada desde GymRat 💪\n\n${lines.join('\n')}`;
  }

  async createActivityForSession(
    usuarioId: number,
    sesion: {
      rutinaId: number;
      semanaId: number;
      diaId: number;
      fecha: string;
      duracion_minutos: number;
    },
  ): Promise<{ activityId: number; activityUrl: string } | null> {
    const accessToken = await this.getValidAccessToken(usuarioId);
    if (!accessToken) return null;

    // Obtener nombres para el título de la actividad y los ejercicios del día
    const [rutina, dia, ejercicioSemanas] = await Promise.all([
      prisma.rutina.findUnique({ where: { id: sesion.rutinaId }, select: { nombre: true } }),
      prisma.dia.findUnique({ where: { id: sesion.diaId }, select: { nombre: true } }),
      prisma.ejercicioSemana.findMany({
        where: {
          semanaId: sesion.semanaId,
          ejercicio: { diaId: sesion.diaId },
        },
        include: {
          ejercicio: { select: { nombre: true } },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    const activityName = [rutina?.nombre, dia?.nombre].filter(Boolean).join(' - ') || 'Entrenamiento';

    const ejerciciosParaDesc = ejercicioSemanas.map((es) => ({
      nombre: es.ejercicio.nombre,
      series: es.series,
      reps: es.reps,
      kg: es.kg,
      tipo_reps: es.tipo_reps,
    }));

    const startDate = new Date(sesion.fecha);
    const startDateLocal = startDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const res = await fetch(`${STRAVA_API_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: activityName,
        sport_type: 'WeightTraining',
        start_date_local: startDateLocal,
        elapsed_time: sesion.duracion_minutos * 60,
        description: this.buildDescription(ejerciciosParaDesc),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Strava create activity failed: ${body}`);
    }

    const activity = (await res.json()) as { id: number };
    return {
      activityId: activity.id,
      activityUrl: `https://www.strava.com/activities/${activity.id}`,
    };
  }
}
