import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Types } from "mongoose";
import { crearApp } from "../../src/app";
import { Partida } from "../../src/modelos/Partida.model";
import { startTemporaryMongo } from "./temporary-mongo";

let database: Awaited<ReturnType<typeof startTemporaryMongo>> | undefined;
let server: Server | undefined;
let base: string;
let ahora = new Date("2026-11-16T04:59:59.999Z");
let lecturasReloj = 0;

before(
  async () => {
    database = await startTemporaryMongo();
    await database.assertConnection();
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
  ahora = new Date("2026-11-16T04:59:59.999Z");
  lecturasReloj = 0;
});

after(async () => {
  try {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
    }
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

const juego = () =>
  http("POST", "/api/videojuegos", 201, {
    nombre: "Fecha civil HAB-03",
    plataforma: "PC",
    genero: "Rol",
    logros: [{ nombre: "Manual", obtenido: true }],
  });
const datos = (videojuego: string, fecha: unknown) => ({
  videojuego,
  fecha,
  duracionMinutos: 90,
  porcentajeAvance: 25,
});

async function snapshot() {
  assert.ok(database);
  await database.assertConnection();
  return Partida.collection.find({}).sort({ _id: 1 }).toArray();
}

test("HAB-03 HTTP: día de inicio conservado en creación, historiales, resumen y progreso", async () => {
  const game = await juego();
  const creada = await http(
    "POST",
    "/api/partidas",
    201,
    datos(game._id, "2026-11-15"),
  );
  assert.equal(lecturasReloj, 1);
  assert.equal(creada.fecha, "2026-11-15T00:00:00.000Z");
  const raw = await Partida.collection.findOne({
    _id: new Types.ObjectId(creada._id),
  });
  assert.equal(raw!.fecha.toISOString(), creada.fecha);
  const general = await http("GET", "/api/partidas", 200);
  assert.equal(
    general.find((p: { _id: string }) => p._id === creada._id).fecha,
    creada.fecha,
  );
  const propias = await http(
    "GET",
    `/api/videojuegos/${game._id}/partidas`,
    200,
  );
  assert.equal(propias[0].fecha, creada.fecha);
  await http("POST", "/api/partidas", 201, {
    ...datos(game._id, "2026-11-15"),
    duracionMinutos: 30,
  });
  const progreso = await http(
    "GET",
    `/api/videojuegos/${game._id}/progreso`,
    200,
  );
  assert.equal(progreso.minutosSemana, 120);
  assert.equal(progreso.diasJugados, 1);
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${game._id}/resumen`, 200),
    {
      totalPartidas: 2,
      horasTotales: 2,
      ultimaPartida: creada.fecha,
      porcentajeAvanceActual: 25,
    },
  );
  // Toda la duración declarada pertenece al domingo, aunque una sesión cruce medianoche.
  ahora = new Date("2026-11-16T05:00:00Z");
  assert.equal(
    (await http("GET", `/api/videojuegos/${game._id}/progreso`, 200))
      .minutosSemana,
    0,
  );
  await http("DELETE", `/api/partidas/${creada._id}`, 204);
  assert.equal(
    (await http("GET", `/api/videojuegos/${game._id}/resumen`, 200))
      .horasTotales,
    0.5,
  );
  assert.deepEqual(
    (await http("GET", `/api/videojuegos/${game._id}`, 200)).logros,
    game.logros,
  );
});

for (const dia of [
  "0001-01-01",
  "0099-12-31",
  "2000-02-29",
  "2024-02-29",
  "9999-12-31",
]) {
  test(`HAB-03 HTTP: admite retroactividad/límite ${dia} sin cambiar el año`, async () => {
    if (dia === "9999-12-31") ahora = new Date("9999-12-31T17:00:00Z");
    const game = await juego();
    const creada = await http(
      "POST",
      "/api/partidas",
      201,
      datos(game._id, dia),
    );
    assert.equal(creada.fecha, `${dia}T00:00:00.000Z`);
    const propias = await http(
      "GET",
      `/api/videojuegos/${game._id}/partidas`,
      200,
    );
    assert.equal(propias[0].fecha, creada.fecha);
  });
}

const invalidas: [string, unknown][] = [
  ["ausente", undefined],
  ["null", null],
  ["vacía", ""],
  ["número", 0],
  ["booleano", true],
  ["objeto", {}],
  ["lista", ["2026-11-15"]],
  ["día imposible", "2026-02-30"],
  ["no bisiesto", "2025-02-29"],
  ["siglo no bisiesto", "1900-02-29"],
  ["mes imposible", "2026-13-01"],
  ["día cero", "2026-11-00"],
  ["año cero", "0000-01-01"],
  ["año fuera de rango", "10000-01-01"],
  ["formato incompleto", "2026-1-01"],
  ["espacios", " 2026-11-15 "],
  ["timestamp UTC", "2026-11-15T00:00:00.000Z"],
  ["timestamp local", "2026-11-15T23:30:00-05:00"],
  ["futura", "2026-11-16"],
];

for (const [caso, fecha] of invalidas) {
  test(`HAB-03 HTTP: fecha ${caso} devuelve 400 sin alterar partidas`, async () => {
    const game = await juego();
    const antes = await snapshot();
    await http("POST", "/api/partidas", 400, datos(game._id, fecha));
    assert.deepEqual(await snapshot(), antes);
  });
}

test("HAB-03 HTTP: mañana solo se admite al llegar las 05:00 UTC", async () => {
  const game = await juego();
  const antes = await snapshot();
  await http("POST", "/api/partidas", 400, datos(game._id, "2026-11-16"));
  assert.deepEqual(await snapshot(), antes);
  ahora = new Date("2026-11-16T05:00:00.000Z");
  const creada = await http(
    "POST",
    "/api/partidas",
    201,
    datos(game._id, "2026-11-16"),
  );
  assert.equal(creada.fecha, "2026-11-16T00:00:00.000Z");
});

for (const zona of [
  "UTC",
  "America/Guayaquil",
  "Asia/Tokyo",
  "America/Los_Angeles",
]) {
  test(`HAB-03 HTTP: TZ ${zona} no altera hoy ni el día persistido`, async () => {
    const anterior = process.env.TZ;
    try {
      process.env.TZ = zona;
      const game = await juego();
      const creada = await http(
        "POST",
        "/api/partidas",
        201,
        datos(game._id, "2026-11-15"),
      );
      assert.equal(creada.fecha, "2026-11-15T00:00:00.000Z");
      const antes = await snapshot();
      await http("POST", "/api/partidas", 400, datos(game._id, "2026-11-16"));
      assert.deepEqual(await snapshot(), antes);
    } finally {
      if (anterior === undefined) delete process.env.TZ;
      else process.env.TZ = anterior;
    }
  });
}

test("HAB-03 HTTP: juego mal formado/inexistente conserva 400/404 sin escrituras", async () => {
  const antes = await snapshot();
  await http("POST", "/api/partidas", 400, datos("incorrecto", "2026-11-15"));
  await http(
    "POST",
    "/api/partidas",
    404,
    datos(new Types.ObjectId().toHexString(), "2026-11-15"),
  );
  assert.deepEqual(await snapshot(), antes);
});

test("HAB-03 HTTP: legado futuro mantiene su día UTC y no se reescribe al consultar", async () => {
  const game = await juego();
  await database!.assertConnection();
  const id = new Types.ObjectId();
  await Partida.collection.insertOne({
    _id: id,
    videojuego: new Types.ObjectId(game._id),
    fecha: new Date("2026-11-16T02:30:00Z"),
    duracionMinutos: 60,
    porcentajeAvance: 80,
  });
  const antes = await snapshot();
  assert.equal(
    (await http("GET", `/api/videojuegos/${game._id}/progreso`, 200))
      .minutosSemana,
    0,
  );
  const resumen = await http(
    "GET",
    `/api/videojuegos/${game._id}/resumen`,
    200,
  );
  assert.equal(resumen.ultimaPartida, "2026-11-16T02:30:00.000Z");
  assert.equal(resumen.horasTotales, 1);
  const propias = await http(
    "GET",
    `/api/videojuegos/${game._id}/partidas`,
    200,
  );
  assert.equal(propias[0].fecha, resumen.ultimaPartida);
  ahora = new Date("2026-11-16T05:00:00Z");
  assert.equal(
    (await http("GET", `/api/videojuegos/${game._id}/progreso`, 200))
      .minutosSemana,
    60,
  );
  assert.deepEqual(await snapshot(), antes);
});
