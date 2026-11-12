import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { crearApp } from "../../src/app";
import { inicializarMetas } from "../../src/services/metas.service";
import { startTemporaryMongo } from "./temporary-mongo";

let database: Awaited<ReturnType<typeof startTemporaryMongo>> | undefined;
let server: Server | undefined;
let base: string;
before(
  async () => {
    database = await startTemporaryMongo();
    await database.assertConnection();
    await inicializarMetas();
    server = crearApp({
      frontendUrl: "http://frontend.example.test",
      reloj: () => new Date("2026-11-11T17:00:00Z"),
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  },
  { timeout: 240_000 },
);
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
  ruta: string,
  esperado = 200,
  datos?: unknown,
) {
  await database!.assertConnection();
  const res = await fetch(base + ruta, {
    method,
    ...(datos
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        }
      : {}),
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(res.status, esperado);
  if (esperado === 204) {
    assert.equal(await res.text(), "");
    return null;
  }
  return res.json();
}
test("INT-01 HTTP: recorrido de edición/hitos/bajas conserva datos ajenos y recalcula desde documentos", async () => {
  const juego = () =>
    http("POST", "/api/videojuegos", 201, {
      nombre: "Flujo INT-01",
      plataforma: "PC",
      genero: "Rol",
      estado: "Completado",
      logros: [{ nombre: "Manual", obtenido: true }],
    });
  const a = await juego(),
    b = await juego();
  const partida = (
    videojuego: string,
    fecha: string,
    duracionMinutos: number,
    porcentajeAvance: number,
  ) =>
    http("POST", "/api/partidas", 201, {
      videojuego,
      fecha,
      duracionMinutos,
      porcentajeAvance,
    });
  await partida(a._id, "2026-11-09", 180, 30);
  const maxima = await partida(a._id, "2026-11-10", 240, 80);
  await partida(b._id, "2026-11-11", 15, 20);
  const meta = await http("POST", "/api/metas", 201, {
    videojuego: a._id,
    minutosObjetivo: 300,
    diasPorSemana: 3,
    hitos: [{ descripcion: "75", porcentajeObjetivo: 75 }],
  });
  const progreso = () => http("GET", `/api/videojuegos/${a._id}/progreso`);
  assert.equal((await progreso()).hitos[0].alcanzado, true);
  await http("PUT", `/api/metas/${meta._id}`, 200, {
    minutosObjetivo: 420,
    diasPorSemana: 2,
  });
  assert.equal((await progreso()).metaCumplida, true);
  assert.equal((await progreso()).hitos[0]._id, meta.hitos[0]._id);
  await http("DELETE", `/api/partidas/${maxima._id}`, 204);
  const p = await progreso();
  assert.equal(p.minutosSemana, 180);
  assert.equal(p.hitos[0].alcanzado, false);
  assert.equal(p.porcentajeAvanceActual, 30);
  assert.equal((await http("GET", "/api/rachas")).mejorRacha, 1);
  await http("DELETE", `/api/metas/${meta._id}`, 204);
  assert.equal((await progreso()).minutosSemana, 180);
  assert.equal((await progreso()).meta, null);
  const nueva = await http("POST", "/api/metas", 201, {
    videojuego: a._id,
    minutosObjetivo: 60,
    diasPorSemana: 1,
  });
  await http("DELETE", `/api/videojuegos/${a._id}`, 204);
  await http("GET", `/api/metas/${meta._id}`, 404);
  await http("GET", `/api/metas/${nueva._id}`, 404);
  assert.equal(
    (await http("GET", `/api/videojuegos/${b._id}/resumen`)).horasTotales,
    0.25,
  );
  assert.equal(
    (await http("GET", `/api/videojuegos/${b._id}`)).logros[0].obtenido,
    true,
  );
  const r = await http("GET", "/api/rachas");
  assert.equal(r.rachaActual, 1);
  assert.equal(r.mejorRacha, 1);
});
