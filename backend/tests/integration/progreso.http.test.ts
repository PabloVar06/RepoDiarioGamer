import assert from "node:assert/strict";
import { after, before, beforeEach, mock, test } from "node:test";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Types } from "mongoose";
import { crearApp } from "../../src/app";
import { inicializarMetas } from "../../src/services/metas.service";
import { Partida } from "../../src/modelos/Partida.model";
import { startTemporaryMongo } from "./temporary-mongo";

let database: Awaited<ReturnType<typeof startTemporaryMongo>> | undefined;
let server: Server | undefined;
let base: string;
let ahora = new Date("2026-11-15T17:00:00Z");
let lecturasReloj = 0;

before(
  async () => {
    database = await startTemporaryMongo();
    await database.assertConnection();
    await inicializarMetas();
    server = crearApp({
      frontendUrl: "http://frontend.example.test",
      reloj: () => {
        lecturasReloj++;
        return new Date(ahora);
      },
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  },
  { timeout: 240_000 },
);

beforeEach(() => {
  ahora = new Date("2026-11-15T17:00:00Z");
  lecturasReloj = 0;
});

after(async () => {
  try {
    if (server?.listening)
      await new Promise<void>((resolve, reject) =>
        server!.close((error) => (error ? reject(error) : resolve())),
      );
  } finally {
    await database?.close();
  }
});

async function http(
  method: string,
  path: string,
  status: number,
  body?: unknown,
) {
  assert.ok(database);
  await database.assertConnection();
  const response = await fetch(`${base}${path}`, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  assert.equal(response.status, status, `${method} ${path}: ${text}`);
  if (status === 204) {
    assert.equal(text, "");
    return null;
  }
  const result = JSON.parse(text);
  if (status >= 400) {
    assert.equal(typeof result.error, "string");
    assert.match(result.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(response.headers.get("x-request-id"), result.requestId);
    assert.equal(result.stack, undefined);
  }
  return result;
}

const juego = (estado = "Jugando") =>
  http("POST", "/api/videojuegos", 201, {
    nombre: "Progreso HTTP",
    plataforma: "PC",
    genero: "Rol",
    estado,
    logros: [{ nombre: "Manual", obtenido: true }],
  });
const partida = (
  videojuego: string,
  fecha: string,
  duracionMinutos = 60,
  porcentajeAvance = 25,
) =>
  http("POST", "/api/partidas", 201, {
    videojuego,
    fecha,
    duracionMinutos,
    porcentajeAvance,
  });
const meta = (videojuego: string, extra = {}) =>
  http("POST", "/api/metas", 201, {
    videojuego,
    minutosObjetivo: 300,
    diasPorSemana: 3,
    ...extra,
  });
const progreso = (id: string) =>
  http("GET", `/api/videojuegos/${id}/progreso`, 200);

test("Progreso HTTP: ID mal formado es 400 e inexistente es 404", async () => {
  await http("GET", "/api/videojuegos/incorrecto/progreso", 400);
  await http("GET", `/api/videojuegos/${new Types.ObjectId()}/progreso`, 404);
});

test("Progreso HTTP: sin meta ni partidas devuelve el DTO completo con ceros y null", async () => {
  const game = await juego();
  assert.deepEqual(await progreso(game._id), {
    videojuego: game._id,
    zonaHoraria: "America/Guayaquil",
    fechaLocalActual: "2026-11-15",
    semana: { inicio: "2026-11-09", fin: "2026-11-15" },
    minutosSemana: 0,
    horasSemana: 0,
    diasJugados: 0,
    porcentajeAvanceActual: 0,
    meta: null,
    porcentajeHoras: null,
    metaCumplida: null,
    hitos: [],
  });
  assert.equal(lecturasReloj, 1);
});

test("Progreso HTTP: límites semanales, mismo día y juegos separados sin meta", async () => {
  const game = await juego();
  const otro = await juego();
  await partida(game._id, "2026-11-08", 200, 80);
  await partida(game._id, "2026-11-09", 30, 10);
  await partida(game._id, "2026-11-09", 60, 20);
  await partida(game._id, "2026-11-15", 15, 15);
  // Dato futuro legado: la nueva API de escritura no debe admitirlo (P02).
  await database!.assertConnection();
  await Partida.collection.insertOne({
    videojuego: new Types.ObjectId(game._id),
    fecha: new Date("2026-11-16T00:00:00Z"),
    duracionMinutos: 1440,
    porcentajeAvance: 100,
  });
  await partida(otro._id, "2026-11-09", 999, 99);
  const resultado = await progreso(game._id);
  assert.equal(resultado.minutosSemana, 105);
  assert.equal(resultado.horasSemana, 1.75);
  assert.equal(resultado.diasJugados, 2);
  assert.equal(resultado.porcentajeAvanceActual, 100); // Máximo E1 incluye todo el historial.
  assert.equal(resultado.meta, null);
  assert.equal(resultado.porcentajeHoras, null);
  assert.equal((await progreso(otro._id)).minutosSemana, 999);
});

test("Progreso HTTP: fixture AC04 cuenta 90 minutos y un día del juego A", async () => {
  ahora = new Date("2026-11-09T17:00:00Z");
  const a = await juego();
  const b = await juego();
  await partida(a._id, "2026-11-09", 30);
  await partida(a._id, "2026-11-09", 60);
  await partida(b._id, "2026-11-09", 15);
  assert.equal((await progreso(a._id)).minutosSemana, 90);
  assert.equal((await progreso(a._id)).diasJugados, 1);
  assert.equal((await progreso(b._id)).minutosSemana, 15);
});

test("Progreso HTTP: meta sin partidas da porcentaje 0, incumplida e hitos pendientes", async () => {
  const game = await juego();
  const activa = await meta(game._id, {
    hitos: [{ descripcion: "Inicio", porcentajeObjetivo: 1 }],
  });
  const resultado = await progreso(game._id);
  assert.deepEqual(resultado.meta, activa);
  assert.equal(resultado.minutosSemana, 0);
  assert.equal(resultado.diasJugados, 0);
  assert.equal(resultado.porcentajeHoras, 0);
  assert.equal(resultado.metaCumplida, false);
  assert.deepEqual(resultado.hitos, [{ ...activa.hitos[0], alcanzado: false }]);
});

test("Progreso HTTP: actividad previa, 140 %, edición, desactivación y nueva meta recalculan", async () => {
  const game = await juego("Completado");
  await partida(game._id, "2026-11-09", 210, 80);
  await partida(game._id, "2026-11-10", 210, 30);
  const activa = await meta(game._id);
  const resultado = await progreso(game._id);
  assert.equal(resultado.horasSemana, 7);
  assert.equal(resultado.porcentajeHoras, 140);
  assert.equal(resultado.metaCumplida, false);
  await http("PUT", `/api/metas/${activa._id}`, 200, {
    minutosObjetivo: 420,
    diasPorSemana: 2,
  });
  assert.equal((await progreso(game._id)).metaCumplida, true);
  const resumen = await http(
    "GET",
    `/api/videojuegos/${game._id}/resumen`,
    200,
  );
  await http("DELETE", `/api/metas/${activa._id}`, 204);
  const sinMeta = await progreso(game._id);
  assert.equal(sinMeta.meta, null);
  assert.equal(sinMeta.porcentajeHoras, null);
  assert.equal(sinMeta.metaCumplida, null);
  assert.equal(sinMeta.minutosSemana, 420);
  await meta(game._id, { minutosObjetivo: 420, diasPorSemana: 2 });
  assert.equal((await progreso(game._id)).metaCumplida, true);
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${game._id}/resumen`, 200),
    resumen,
  );
});

test("Progreso HTTP: hitos usan máximo acumulado y cambian al borrar la sesión máxima", async () => {
  const game = await juego("Abandonado");
  const maxima = await partida(game._id, "2026-10-01", 60, 80);
  await partida(game._id, "2026-11-09", 60, 30);
  await partida(game._id, "2026-11-10", 60, 70);
  await meta(game._id, {
    hitos: [{ descripcion: "Avance", porcentajeObjetivo: 75 }],
  });
  const antes = await progreso(game._id);
  assert.equal(antes.hitos[0].alcanzado, true);
  assert.equal(antes.porcentajeAvanceActual, 80);
  assert.equal(antes.minutosSemana, 120);
  await http("DELETE", `/api/partidas/${maxima._id}`, 204);
  const despues = await progreso(game._id);
  assert.equal(despues.hitos[0].alcanzado, false);
  assert.equal(despues.porcentajeAvanceActual, 70);
  assert.equal(despues.hitos[0]._id, antes.hitos[0]._id);
  assert.deepEqual(
    (await http("GET", `/api/videojuegos/${game._id}`, 200)).logros,
    game.logros,
  );
});

test("Progreso HTTP: una referencia temporal por consulta y cambio domingo/lunes en Guayaquil", async () => {
  const game = await juego();
  await partida(game._id, "2026-11-15", 90);
  lecturasReloj = 0; // Medir las dos consultas, sin incluir la nueva escritura.
  ahora = new Date("2026-11-16T04:59:59Z");
  assert.equal((await progreso(game._id)).minutosSemana, 90);
  ahora = new Date("2026-11-16T05:00:00Z");
  const lunes = await progreso(game._id);
  assert.equal(lunes.fechaLocalActual, "2026-11-16");
  assert.deepEqual(lunes.semana, { inicio: "2026-11-16", fin: "2026-11-22" });
  assert.equal(lunes.minutosSemana, 0);
  assert.equal(lecturasReloj, 2);
});

test("Progreso HTTP: futuro antiguo se excluye hasta su día sin mutar documentos", async () => {
  const game = await juego();
  await partida(game._id, "2026-11-15", 60);
  const activa = await meta(game._id);
  const antes = await Partida.find({ videojuego: game._id }).lean();
  ahora = new Date("2026-11-11T17:00:00Z");
  assert.equal((await progreso(game._id)).minutosSemana, 0);
  ahora = new Date("2026-11-15T17:00:00Z");
  assert.equal((await progreso(game._id)).minutosSemana, 60);
  assert.deepEqual(await Partida.find({ videojuego: game._id }).lean(), antes);
  assert.deepEqual(await http("GET", `/api/metas/${activa._id}`, 200), activa);
});

test("Progreso HTTP: resumen E1 mantiene contrato, redondeo y máximo tras bajas", async () => {
  const game = await juego();
  const resumen = () =>
    http("GET", `/api/videojuegos/${game._id}/resumen`, 200);
  assert.deepEqual(await resumen(), {
    totalPartidas: 0,
    horasTotales: 0,
    ultimaPartida: null,
    porcentajeAvanceActual: 0,
  });
  const a = await partida(game._id, "2026-11-09", 1, 80);
  await partida(game._id, "2026-11-10", 1, 30);
  const antes = await resumen();
  assert.deepEqual(antes, {
    totalPartidas: 2,
    horasTotales: 0.03,
    ultimaPartida: "2026-11-10T00:00:00.000Z",
    porcentajeAvanceActual: 80,
  });
  assert.equal((await progreso(game._id)).horasSemana, 2 / 60);
  assert.deepEqual(await resumen(), antes);
  await http("DELETE", `/api/partidas/${a._id}`, 204);
  assert.equal((await resumen()).horasTotales, 0.02);
  assert.equal((await progreso(game._id)).porcentajeAvanceActual, 30);
});

test("Progreso HTTP: dato legado inválido es 500 controlado y no se corrige al leer", async () => {
  const game = await juego();
  await database!.assertConnection();
  const collection = Partida.collection;
  const id = new Types.ObjectId();
  await collection.insertOne({
    _id: id,
    videojuego: new Types.ObjectId(game._id),
    fecha: "fecha-invalida",
    duracionMinutos: 60,
    porcentajeAvance: 25,
  });
  const antes = await collection.findOne({ _id: id });
  const error = await http("GET", `/api/videojuegos/${game._id}/progreso`, 500);
  assert.equal(error.error, "Error interno del servidor");
  assert.deepEqual(await collection.findOne({ _id: id }), antes);
});

test("Progreso HTTP: fallo de consulta no se transforma en un resultado vacío", async () => {
  const game = await juego();
  const fallo = mock.method(Partida, "find", () => {
    throw new Error("Fallo sintético de consulta");
  });
  try {
    await http("GET", `/api/videojuegos/${game._id}/progreso`, 500);
  } finally {
    fallo.mock.restore();
  }
});
