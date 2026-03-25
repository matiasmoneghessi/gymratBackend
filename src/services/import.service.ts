import OpenAI from 'openai';
import { logger } from '../utils/logger';
import type { CreateRutinaInput } from './rutina.service';

const SYSTEM_PROMPT = `Sos un asistente que interpreta archivos de rutinas de gimnasio y los convierte a JSON estructurado.

El usuario te va a pasar el contenido de un archivo (puede ser texto plano, CSV, planilla, etc.) que describe una rutina de entrenamiento.

Tenés que devolver ÚNICAMENTE un JSON válido (sin markdown, sin backticks, sin texto extra) con esta estructura exacta:

{
  "nombre": "Nombre de la rutina",
  "semanas": [
    {
      "nombre": "Semana 1",
      "tipo_esfuerzo": "Normal",
      "dias": [
        {
          "nombre": "Día 1 - Pecho y Tríceps",
          "movilidad": "texto opcional o null",
          "activacion": "texto opcional o null",
          "ejercicios": [
            {
              "nombre": "Press banca",
              "codigo": "A1",
              "ejercicioSemanas": [
                {
                  "semanaNumero": 1,
                  "kg": 60,
                  "reps": 10,
                  "series": 4,
                  "tipo_reps": "reps"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

Reglas:
- "tipo_reps" puede ser "reps" (repeticiones) o "seg" (segundos). Si dice "segundos", "seg", "s" o similar, usá "seg". Si no se especifica, usá "reps".
- "kg" es un número o null si no se indica peso.
- "codigo" es un código corto como "A1", "B2", etc. Si no hay, ponelo null.
- Si hay múltiples semanas con diferentes pesos/reps, creá una semana por cada una. Cada ejercicio debe tener un ejercicioSemanas con semanaNumero apuntando a su propia semana (ej: semana 1 → semanaNumero: 1).
- Si solo hay una semana o no se distinguen semanas, creá una sola semana.
- "tipo_esfuerzo" puede ser algo como "Normal", "Descarga", "Intenso", etc. Si no se indica, usá "Normal".
- Intentá agrupar ejercicios por día si hay alguna separación lógica.
- Si no podés interpretar el archivo, devolvé: {"error": "No pude interpretar el contenido del archivo"}
- SOLO devolvé el JSON, nada más.`;

export class ImportService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async parseFileToRutina(fileContent: string, fileName?: string): Promise<CreateRutinaInput> {
    const userMessage = fileName
      ? `Archivo: "${fileName}"\n\nContenido:\n${fileContent}`
      : `Contenido del archivo:\n${fileContent}`;

    logger.info(`Enviando archivo a OpenAI para interpretar (${fileContent.length} chars)`);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI no devolvió respuesta');
    }

    logger.info('Respuesta recibida de OpenAI, parseando JSON...');

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Intentar extraer JSON si viene con backticks
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsed = JSON.parse(match[1].trim());
      } else {
        throw new Error('La respuesta de OpenAI no es JSON válido');
      }
    }

    const obj = parsed as Record<string, unknown>;
    if (obj.error) {
      throw new Error(obj.error as string);
    }

    if (!obj.nombre || !Array.isArray(obj.semanas) || obj.semanas.length === 0) {
      throw new Error('El JSON generado no tiene la estructura esperada (falta nombre o semanas)');
    }

    return parsed as CreateRutinaInput;
  }
}
