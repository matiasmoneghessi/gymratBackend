import { openai } from '../utils/openaiClient';

const SYSTEM_PROMPT = `Eres un asistente especializado en procesar archivos de rutinas de gimnasio.
El usuario te enviará el contenido crudo de un archivo (CSV, texto plano, tabla de Google Sheets u otro formato).
Tu tarea es interpretar la información y devolver un JSON que represente la rutina de entrenamiento.

IMPORTANTE: Respondé ÚNICAMENTE con el JSON puro. Sin texto adicional, sin explicaciones, sin bloques de markdown, sin backticks.

El JSON debe tener EXACTAMENTE esta estructura:
{
  "nombre": "nombre de la rutina",
  "semanas": [
    {
      "nombre": "nombre de la semana (ej: Adaptación, Fuerza, Descarga)",
      "tipo_esfuerzo": "tipo de esfuerzo (ej: Moderado, Alto, Bajo, Normal)",
      "dias": [
        {
          "nombre": "nombre del día (ej: Tren Superior, Push, Piernas A)",
          "movilidad": "descripción de movilidad o null",
          "activacion": "descripción de activación o null",
          "ejercicios": [
            {
              "nombre": "nombre completo del ejercicio",
              "codigo": "código corto como A1 o B2 o null",
              "kg": null,
              "reps": 0,
              "series": 0,
              "tipo_reps": "reps"
            }
          ]
        }
      ]
    }
  ]
}

Reglas de interpretación:
- Si hay varias semanas (bloques de progresión), creá una entrada por semana.
- Si no hay nombre de semana, usá "Semana 1", "Semana 2", etc.
- Si no hay tipo de esfuerzo indicado, usá "Normal".
- Si los kg no están especificados o son 0, usá null.
- Si las repeticiones están expresadas en segundos (ej: "30s", "30 seg", "30''"), usá tipo_reps "seg" y el número sin la unidad.
- En cualquier otro caso usá tipo_reps "reps".
- Si un ejercicio tiene código (ej: A1, B2, 1a), ponelo en "codigo", sino null.
- Si hay movilidad o activación para el día, incluilas como texto, sino null.
- Nunca inventes ejercicios. Solo usá lo que está en el archivo.
- Si el archivo tiene múltiples días por semana, creá un día por cada bloque.
- Si el contenido es ilegible o no parece una rutina de gimnasio, devolvé: {"error": "No se pudo interpretar el archivo como una rutina de gimnasio."}`;

export interface ImportarRutinaResult {
  nombre: string;
  semanas: {
    nombre: string;
    tipo_esfuerzo: string;
    dias: {
      nombre: string;
      movilidad: string | null;
      activacion: string | null;
      ejercicios: {
        nombre: string;
        codigo: string | null;
        kg: number | null;
        reps: number;
        series: number;
        tipo_reps: 'reps' | 'seg';
      }[];
    }[];
  }[];
}

export class ImportarService {
  async parsearRutina(contenido: string, fileName: string): Promise<ImportarRutinaResult> {
    const userMessage = `Nombre del archivo: ${fileName}\n\nContenido:\n${contenido.slice(0, 12000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('La IA no devolvió un JSON válido. Intentá de nuevo.');
    }

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    if (!parsed.nombre || !Array.isArray(parsed.semanas)) {
      throw new Error('El JSON devuelto no tiene el formato esperado.');
    }

    return parsed as ImportarRutinaResult;
  }
}
