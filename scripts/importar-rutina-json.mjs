// Convierte un JSON de semanas (con ejercicios por nombre) al formato que espera
// POST /rutinas y lo crea contra la API indicada.
//
// Uso:
//   node scripts/importar-rutina-json.mjs <ruta-al-json> "<Nombre de la rutina>"
//
// Variables de entorno requeridas:
//   API_URL       (ej: https://gymratbackend.onrender.com/api)
//   ACCESS_TOKEN  (Bearer token de Supabase)

import { readFile } from 'node:fs/promises';

const [, , jsonPath, rutinaNombre] = process.argv;

if (!jsonPath || !rutinaNombre) {
  console.error('Uso: node importar-rutina-json.mjs <ruta-al-json> "<Nombre de la rutina>"');
  process.exit(1);
}

const API_URL = process.env.API_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

if (!API_URL || !ACCESS_TOKEN) {
  console.error('Faltan las variables de entorno API_URL y/o ACCESS_TOKEN.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${ACCESS_TOKEN}`,
};

async function resolverCatalogoEjercicioId(nombre, cache) {
  if (cache.has(nombre)) return cache.get(nombre);

  const res = await fetch(`${API_URL}/catalogo-ejercicios`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nombre }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`No se pudo resolver el ejercicio "${nombre}": ${JSON.stringify(body)}`);
  }

  const id = body.data.id;
  cache.set(nombre, id);
  return id;
}

async function main() {
  const raw = await readFile(jsonPath, 'utf-8');
  const semanasCrudas = JSON.parse(raw);

  if (!Array.isArray(semanasCrudas)) {
    throw new Error('El JSON de entrada debe ser un array de semanas.');
  }

  const cache = new Map();
  const semanas = [];

  for (const semana of semanasCrudas) {
    const dias = [];

    for (const dia of semana.dias) {
      const ejercicios = [];

      for (const ej of dia.ejercicios) {
        const catalogoEjercicioId = await resolverCatalogoEjercicioId(ej.nombre, cache);
        ejercicios.push({
          catalogoEjercicioId,
          codigo: ej.codigo ?? null,
          ejercicioSemanas: ej.ejercicioSemanas.map((es) => ({
            semanaNumero: es.semanaNumero,
            kg: es.kg,
            reps: es.reps,
            series: es.series,
            tipo_reps: es.tipo_reps ?? 'reps',
          })),
        });
      }

      dias.push({
        nombre: dia.nombre,
        movilidad: dia.movilidad ?? null,
        activacion: dia.activacion ?? null,
        ejercicios,
      });
    }

    semanas.push({
      nombre: semana.nombre,
      tipo_esfuerzo: semana.tipo_esfuerzo,
      dias,
    });
  }

  const body = { nombre: rutinaNombre, semanas };

  console.log(`Ejercicios resueltos: ${cache.size}`);
  console.log('Creando rutina...');

  const res = await fetch(`${API_URL}/rutinas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const result = await res.json();
  console.log('HTTP', res.status);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
