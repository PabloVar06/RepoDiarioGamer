import assert from "node:assert/strict";
import { after, before, beforeEach, mock, test } from "node:test";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { crearApp } from "../../src/app";
import { Partida } from "../../src/modelos/Partida.model";
import { Videojuego } from "../../src/modelos/Videojuego.model";
import { Meta } from "../../src/modelos/Meta.model";
import { inicializarMetas } from "../../src/services/metas.service";
import { startTemporaryMongo } from "./temporary-mongo";

let database: Awaited<ReturnType<typeof startTemporaryMongo>> | undefined;
let server: Server | undefined;
let base: string;
let ahora = new Date("2026-11-11T17:00:00Z");
let lecturas = 0;
before(
  async () => {
    database = await startTemporaryMongo();
    await database.assertConnection();
    await inicializarMetas();
    server = crearApp({
      frontendUrl: "http://frontend.example.test",
      reloj: () => {
        lecturas++;
        return new Date(ahora);
      },
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  },
  { timeout: 240_000 },
);
beforeEach(async () => {
  await database!.assertConnection();
  // Solo la base UUID creada y verificada por ESTE proceso.
  await Promise.all([
    Partida.deleteMany({}),
    Meta.deleteMany({}),
    Videojuego.deleteMany({}),
  ]);
  ahora = new Date("2026-11-11T17:00:00Z");
  lecturas = 0;
});
after(async () => {
  try {
    if (server?.listening)
      await new Promise<void>((resolve, reject) =>
        server!.close((e) => (e ? reject(e) : resolve())),
      );
  } finally {
    await database?.close();
  }
});
async function http(
  method: string,
  path: string,
  esperado: number,
  datos?: unknown,
) {
  await database!.assertConnection();
  const response = await fetch(`${base}${path}`, {
    method,
    headers: datos ? { "Content-Type": "application/json" } : undefined,
    body: datos ? JSON.stringify(datos) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, esperado);
  if (esperado === 204) {
    assert.equal(await response.text(), "");
    return null;
  }
  const body = await response.json();
  if (esperado >= 400) {
    assert.match(body.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(response.headers.get("x-request-id"), body.requestId);
    assert.equal(body.stack, undefined);
  }
  return body;
}
const juego = (estado = "Jugando") =>
  http("POST", "/api/videojuegos", 201, {
    nombre: "Racha HTTP",
    plataforma: "PC",
    genero: "Rol",
    estado,
  });
const partida = (videojuego: string, fecha: string, duracionMinutos = 30) =>
  http("POST", "/api/partidas", 201, {
    videojuego,
    fecha,
    duracionMinutos,
    porcentajeAvance: 20,
  });
const rachas = () => http("GET", "/api/rachas", 200);

test("Rachas HTTP: sin metas ni partidas devuelve ceros y contrato global", async () => {
  assert.deepEqual(await rachas(), {
    ambito: "global",
    zonaHoraria: "America/Guayaquil",
    fechaLocalActual: "2026-11-11",
    rachaActual: 0,
    mejorRacha: 0,
  });
  assert.equal(lecturas, 1);
});
test("Rachas HTTP: AC04 deduplica tres partidas en dos videojuegos", async () => {
  const a = await juego();
  const b = await juego("Completado");
  await partida(a._id, "2026-11-11", 30);
  await partida(a._id, "2026-11-11", 60);
  await partida(b._id, "2026-11-11", 15);
  assert.equal((await rachas()).rachaActual, 1);
  assert.equal((await rachas()).mejorRacha, 1);
  const progreso = await http("GET", `/api/videojuegos/${a._id}/progreso`, 200);
  assert.equal(progreso.minutosSemana, 90);
  assert.equal(progreso.diasJugados, 1);
});
test("Rachas HTTP: todos los estados, metas activas/inactivas y sin meta mantienen la racha global", async () => {
  let ultimo: string;
  for (const [i, estado] of [
    "Jugando",
    "Pausado",
    "Completado",
    "Abandonado",
  ].entries()) {
    const g = await juego(estado);
    ultimo = g._id;
    await partida(g._id, `2026-11-${String(i + 8).padStart(2, "0")}`);
    if (i < 2) {
      const meta = await http("POST", "/api/metas", 201, {
        videojuego: g._id,
        minutosObjetivo: 60,
        diasPorSemana: 2,
      });
      if (i === 1) await http("DELETE", `/api/metas/${meta._id}`, 204);
    }
  }
  const resumen = await http("GET", `/api/videojuegos/${ultimo!}/resumen`, 200);
  assert.equal((await rachas()).rachaActual, 4);
  assert.equal((await rachas()).mejorRacha, 4);
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${ultimo!}/resumen`, 200),
    resumen,
  );
});
test("Rachas HTTP: corte Guayaquil conserva ayer y luego vuelve a cero; récord histórico permanece", async () => {
  const a = await juego();
  await partida(a._id, "2026-11-09");
  await partida(a._id, "2026-11-10");
  ahora = new Date("2026-11-12T04:59:59.999Z");
  assert.equal((await rachas()).rachaActual, 2);
  ahora = new Date("2026-11-12T05:00:00.000Z");
  const resultado = await rachas();
  assert.equal(resultado.fechaLocalActual, "2026-11-12");
  assert.equal(resultado.rachaActual, 0);
  assert.equal(resultado.mejorRacha, 2);
});
test("Rachas HTTP: eliminación/retroactividad recalculan; otra partida conserva el día; cascada elimina solo su juego", async () => {
  const a = await juego();
  const b = await juego();
  await partida(a._id, "2026-11-09");
  const p = await partida(a._id, "2026-11-10");
  await partida(b._id, "2026-11-10");
  await partida(b._id, "2026-11-11");
  const meta = await http("POST", "/api/metas", 201, {
    videojuego: a._id,
    minutosObjetivo: 60,
    diasPorSemana: 2,
  });
  assert.equal((await rachas()).mejorRacha, 3);
  await http("DELETE", `/api/partidas/${p._id}`, 204);
  assert.equal((await rachas()).rachaActual, 3);
  await http("DELETE", `/api/videojuegos/${a._id}`, 204);
  assert.equal((await rachas()).rachaActual, 2);
  assert.equal((await rachas()).mejorRacha, 2);
  await http("GET", `/api/metas/${meta._id}`, 404);
  assert.equal(
    (await http("GET", `/api/videojuegos/${b._id}/partidas`, 200)).length,
    2,
  );
  await partida(b._id, "2026-11-09");
  assert.equal((await rachas()).mejorRacha, 3);
});
test("Rachas HTTP: P07 usa componente UTC legado y excluye futuro sin alterar resumen E1", async () => {
  const a = await juego();
  await database!.assertConnection();
  await Partida.collection.insertMany([
    {
      videojuego: new mongoose.Types.ObjectId(a._id),
      fecha: new Date("2026-11-11T02:30:00Z"),
      duracionMinutos: 30,
      porcentajeAvance: 20,
    },
    {
      videojuego: new mongoose.Types.ObjectId(a._id),
      fecha: new Date("2026-11-12T00:00:00Z"),
      duracionMinutos: 30,
      porcentajeAvance: 20,
    },
  ]);
  const resumen = await http("GET", `/api/videojuegos/${a._id}/resumen`, 200);
  assert.equal((await rachas()).mejorRacha, 1);
  assert.equal(resumen.totalPartidas, 2);
});
test("Rachas HTTP: fecha almacenada ilegible produce 500 controlado, no ceros", async () => {
  await database!.assertConnection();
  await mongoose.connection
    .db!.collection("partidas")
    .insertOne({ fecha: "no interpretable" });
  assert.equal(
    (await http("GET", "/api/rachas", 500)).error,
    "Error interno del servidor",
  );
});
test("Rachas HTTP: fallo de consulta mantiene 500 con requestId", async () => {
  const interceptado = mock.method(Partida, "find", () => {
    throw new Error("Fallo sintético rachas");
  });
  try {
    assert.equal(
      (await http("GET", "/api/rachas", 500)).error,
      "Error interno del servidor",
    );
  } finally {
    interceptado.mock.restore();
  }
});
