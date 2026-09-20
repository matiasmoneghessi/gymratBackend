import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
const modelName = process.env.VERTEX_AI_MODEL ?? 'gemini-2.0-flash-001';

if (!project) {
  console.warn('[VertexAI] GOOGLE_CLOUD_PROJECT no está configurado.');
}

const vertexAI = project
  ? new VertexAI({ project, location })
  : null;

export async function generateTextWithVertexAI(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  if (!vertexAI) {
    throw new Error(
      'Vertex AI no está configurado. Definí GOOGLE_CLOUD_PROJECT y las credenciales de Google Cloud.',
    );
  }

  const model = vertexAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
  });

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error('Vertex AI no devolvió respuesta.');
  }

  return text;
}
