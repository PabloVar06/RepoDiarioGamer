import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Types } from "mongoose";
import { crearApp } from "../../src/app";
import { Meta } from "../../src/modelos/Meta.model";
import { inicializarMetas } from "../../src/services/metas.service";
import { startTemporaryMongo } from "./temporary-mongo";

let database: Awaited<ReturnType<typeof startTemporaryMongo>> | undefined;
let server: Server | undefined;
let base: string;
const objetivos = { minutosObjetivo: 120, diasPorSemana: 3 };
const idNuevo = () => new Types.ObjectId().toHexString();

before(
  async () => {
    database = await startTemporaryMongo();
    await database.assertConnection();
    await inicializarMetas();
    server = crearApp({
      frontendUrl: "http://frontend.example.test",
      reloj: () => new Date("2026-11-15T17:00:00Z"),
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  },
  { timeout: 240_000 },
);

after(async () => {
  try {
    if (server?.listening)
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
  } finally {
    await database?.close();
  }
});

async function enviar(method: string, path: string, body?: unknown) {
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
  if (response.status === 204) assert.equal(text, "");
  const result = text ? JSON.parse(text) : null;
  if (response.status >= 400) {
    assert.equal(typeof result.error, "string");
    assert.match(result.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(response.headers.get("x-request-id"), result.requestId);
    assert.equal(result.stack, undefined);
  }
  return { status: response.status, body: result };
}

async function http(
  method: string,
  path: string,
  status: number,
  body?: unknown,
) {
  const result = await enviar(method, path, body);
  assert.equal(
    result.status,
    status,
    `${method} ${path}: ${JSON.stringify(result.body)}`,
  );
  return result.body;
}

const juego = (estado = "Jugando") =>
  http("POST", "/api/videojuegos", 201, {
    nombre: "Juego Meta HTTP",
    plataforma: "PC",
    genero: "Rol",
    estado,
  });
const crear = (videojuego: string, extra = {}) =>
  http("POST", "/api/metas", 201, { videojuego, ...objetivos, ...extra });

test("Meta HTTP: crear, consultar y editar sin exponer propiedades internas", async () => {
  const game = await juego();
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${game._id}/meta`, 200),
    { meta: null },
  );
  const meta = await crear(game._id);
  assert.equal(meta.videojuego, game._id);
  assert.equal(meta.activa, true);
  assert.deepEqual(meta.hitos, []);
  assert.match(meta._id, /^[a-f0-9]{24}$/);
  assert.equal(new Date(meta.createdAt).toISOString(), meta.createdAt);
  assert.equal(meta.updatedAt, meta.createdAt);
  assert.deepEqual(
    Object.keys(meta).sort(),
    [
      "_id",
      "videojuego",
      "minutosObjetivo",
      "diasPorSemana",
      "activa",
      "hitos",
      "createdAt",
      "updatedAt",
    ].sort(),
  );
  assert.deepEqual(await http("GET", `/api/metas/${meta._id}`, 200), meta);
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${game._id}/meta`, 200),
    { meta },
  );
  for (const cambios of [
    { minutosObjetivo: 1, diasPorSemana: 1 },
    { minutosObjetivo: 6000, diasPorSemana: 7 },
  ]) {
    const editada = await http("PUT", `/api/metas/${meta._id}`, 200, cambios);
    assert.equal(editada.minutosObjetivo, cambios.minutosObjetivo);
    assert.equal(editada.diasPorSemana, cambios.diasPorSemana);
    assert.equal(editada.createdAt, meta.createdAt);
    assert.equal(editada.videojuego, game._id);
  }
  await http("GET", `/api/videojuegos/${game._id}/resumen`, 200);
});

test("Meta HTTP: duplicados secuenciales/concurrentes son 409 y juegos distintos son independientes", async () => {
  const game = await juego();
  const otras = await juego();
  const results = await Promise.all([
    enviar("POST", "/api/metas", { videojuego: game._id, ...objetivos }),
    enviar("POST", "/api/metas", { videojuego: game._id, ...objetivos }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  await http("POST", "/api/metas", 409, { videojuego: game._id, ...objetivos });
  await crear(otras._id);
  assert.equal(
    await Meta.countDocuments({ videojuego: game._id, activa: true }),
    1,
  );
});

test("Meta HTTP: desactivación idempotente conserva históricas, partidas y otro juego; no permite reactivar", async () => {
  const game = await juego();
  const otro = await juego();
  const ajena = await crear(otro._id);
  await http("POST", "/api/partidas", 201, {
    videojuego: game._id,
    fecha: "2026-11-09",
    duracionMinutos: 45,
    porcentajeAvance: 30,
  });
  const resumen = await http(
    "GET",
    `/api/videojuegos/${game._id}/resumen`,
    200,
  );
  const partidas = await http(
    "GET",
    `/api/videojuegos/${game._id}/partidas`,
    200,
  );
  for (let i = 0; i < 2; i++) {
    const meta = await crear(game._id);
    await http("DELETE", `/api/metas/${meta._id}`, 204);
    const historica = await http("GET", `/api/metas/${meta._id}`, 200);
    assert.equal(historica.activa, false);
    await http("DELETE", `/api/metas/${meta._id}`, 204);
    assert.deepEqual(
      await http("GET", `/api/metas/${meta._id}`, 200),
      historica,
    );
    await http("PUT", `/api/metas/${meta._id}`, 409, objetivos);
    await http("PUT", `/api/metas/${meta._id}`, 400, {
      ...objetivos,
      activa: true,
    });
    await http("POST", `/api/metas/${meta._id}/reactivar`, 404);
    assert.deepEqual(
      await http("GET", `/api/metas/${meta._id}`, 200),
      historica,
    );
  }
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${game._id}/meta`, 200),
    { meta: null },
  );
  const nueva = await crear(game._id);
  assert.equal(
    await Meta.countDocuments({ videojuego: game._id, activa: false }),
    2,
  );
  assert.equal(
    await Meta.countDocuments({ videojuego: game._id, activa: true }),
    1,
  );
  assert.equal(nueva.activa, true);
  assert.deepEqual(await http("GET", `/api/metas/${ajena._id}`, 200), ajena);
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${game._id}/resumen`, 200),
    resumen,
  );
  assert.deepEqual(
    await http("GET", `/api/videojuegos/${game._id}/partidas`, 200),
    partidas,
  );
});

test("Meta HTTP: permite creación/edición en todos los estados E1", async () => {
  for (const estado of ["Jugando", "Pausado", "Completado", "Abandonado"]) {
    const game = await juego(estado);
    const meta = await crear(game._id, {
      minutosObjetivo: 1,
      diasPorSemana: 1,
    });
    await http("PUT", `/api/metas/${meta._id}`, 200, objetivos);
    await http("PUT", `/api/videojuegos/${game._id}`, 200, {
      estado: "Abandonado",
    });
    assert.equal(
      (await http("GET", `/api/metas/${meta._id}`, 200)).activa,
      true,
    );
  }
});

test("Meta HTTP: IDs y referencias separan 400 de 404 sin escribir", async (t) => {
  const cantidad = await Meta.countDocuments();
  for (const [id, status] of [
    ["incorrecto", 400],
    [idNuevo(), 404],
  ] as const) {
    for (const method of ["GET", "PUT", "DELETE"])
      await t.test(`${method} ${status}`, async () => {
        await http(
          method,
          `/api/metas/${id}`,
          status,
          method === "PUT" ? objetivos : undefined,
        );
      });
    await http("GET", `/api/videojuegos/${id}/meta`, status);
    await http("POST", "/api/metas", status, { videojuego: id, ...objetivos });
  }
  assert.equal(await Meta.countDocuments(), cantidad);
});

test("Meta HTTP: DTO inválidos no crean ni alteran metas", async (t) => {
  const game = await juego();
  const meta = await crear(game._id);
  const cantidad = await Meta.countDocuments();
  const overrides: Record<string, unknown>[] = [
    { minutosObjetivo: 0 },
    { minutosObjetivo: 6001 },
    { minutosObjetivo: 1.5 },
    { minutosObjetivo: "120" },
    { minutosObjetivo: true },
    { minutosObjetivo: null },
    { minutosObjetivo: undefined },
    { diasPorSemana: 0 },
    { diasPorSemana: 8 },
    { diasPorSemana: 1.5 },
    { diasPorSemana: "3" },
    { diasPorSemana: null },
    { diasPorSemana: undefined },
    { activa: false },
    { createdAt: "2020-01-01" },
    { updatedAt: "2020-01-01" },
    { _id: idNuevo() },
    { campoAjeno: true },
    { hitos: null },
    { hitos: {} },
    { hitos: [null] },
    { hitos: [{ descripcion: "   ", porcentajeObjetivo: 1 }] },
    { hitos: [{ descripcion: "x".repeat(121), porcentajeObjetivo: 1 }] },
    { hitos: [{ descripcion: 2, porcentajeObjetivo: 1 }] },
    { hitos: [{ descripcion: "Hito" }] },
    { hitos: [{ descripcion: "Hito", porcentajeObjetivo: 0 }] },
    { hitos: [{ descripcion: "Hito", porcentajeObjetivo: 101 }] },
    { hitos: [{ descripcion: "Hito", porcentajeObjetivo: 1.5 }] },
    { hitos: [{ descripcion: "Hito", porcentajeObjetivo: "50" }] },
    {
      hitos: [{ descripcion: "Hito", porcentajeObjetivo: 50, alcanzado: true }],
    },
    {
      hitos: Array.from({ length: 6 }, () => ({
        descripcion: "Hito",
        porcentajeObjetivo: 50,
      })),
    },
  ];
  for (const [i, cambio] of overrides.entries())
    await t.test(`DTO inválido ${i + 1}`, async () => {
      await http("POST", "/api/metas", 400, {
        videojuego: game._id,
        ...objetivos,
        ...cambio,
      });
      await http("PUT", `/api/metas/${meta._id}`, 400, {
        ...objetivos,
        ...cambio,
      });
      assert.deepEqual(await http("GET", `/api/metas/${meta._id}`, 200), meta);
    });
  await http("PUT", `/api/metas/${meta._id}`, 400, {
    ...objetivos,
    videojuego: idNuevo(),
  });
  await http("POST", "/api/metas", 400, objetivos);
  await http("POST", "/api/metas", 400, { ...objetivos, videojuego: 123 });
  for (const body of [[], {}, [objetivos]]) {
    await http("POST", "/api/metas", 400, body);
    await http("PUT", `/api/metas/${meta._id}`, 400, body);
  }
  assert.equal(await Meta.countDocuments(), cantidad);
});

test("Meta HTTP: hitos conservan identidad, admiten duplicados y validan reemplazos completos", async () => {
  const game = await juego();
  const hito = { descripcion: "  Inicio  ", porcentajeObjetivo: 1 };
  const meta = await crear(game._id, {
    hitos: [
      hito,
      hito,
      { descripcion: "x".repeat(120), porcentajeObjetivo: 100 },
    ],
  });
  assert.equal(meta.hitos[0].descripcion, "Inicio");
  assert.notEqual(meta.hitos[0]._id, meta.hitos[1]._id);
  assert.deepEqual(
    (await http("PUT", `/api/metas/${meta._id}`, 200, objetivos)).hitos,
    meta.hitos,
  );
  const cambios = {
    ...objetivos,
    minutosObjetivo: 90,
    hitos: [
      { ...meta.hitos[0], descripcion: "Revisado" },
      { descripcion: "Nuevo", porcentajeObjetivo: 50 },
    ],
  };
  const editada = await http("PUT", `/api/metas/${meta._id}`, 200, cambios);
  assert.equal(editada.hitos[0]._id, meta.hitos[0]._id);
  assert.equal(editada.hitos[0].descripcion, "Revisado");
  assert.ok(
    !meta.hitos.some((h: { _id: string }) => h._id === editada.hitos[1]._id),
  );
  for (const hitos of [
    [{ ...hito, _id: idNuevo() }],
    [{ ...hito, _id: "invalido" }],
    [editada.hitos[0], editada.hitos[0]],
    [{ ...editada.hitos[0], porcentajeObjetivo: 101 }],
  ]) {
    await http("PUT", `/api/metas/${meta._id}`, 400, {
      ...objetivos,
      minutosObjetivo: 5,
      hitos,
    });
    assert.deepEqual(await http("GET", `/api/metas/${meta._id}`, 200), editada);
  }
  const otro = await juego();
  await http("POST", "/api/metas", 400, {
    videojuego: otro._id,
    ...objetivos,
    hitos: [meta.hitos[0]],
  });
  assert.deepEqual(
    (
      await http("PUT", `/api/metas/${meta._id}`, 200, {
        ...objetivos,
        hitos: [],
      })
    ).hitos,
    [],
  );
});

test("Meta HTTP: carrera PUT/DELETE nunca reactiva; DELETE ganador antes de escritura produce 409", async () => {
  const game = await juego();
  const meta = await crear(game._id);
  let liberar!: () => void;
  let avisar!: () => void;
  const espera = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  const iniciada = new Promise<void>((resolve) => {
    avisar = resolve;
  });
  const original = Meta.findOneAndUpdate;
  const interceptado = mock.method(
    Meta,
    "findOneAndUpdate",
    function (...args: Parameters<typeof original>) {
      const consulta = original.apply(Meta, args);
      const ejecutar = consulta.exec;
      // Solo se retrasa la consulta PUT real; DELETE y MongoDB no se simulan.
      if (args[1]?.$set?.minutosObjetivo === 77) {
        consulta.exec = async function () {
          avisar();
          await espera;
          return ejecutar.call(consulta);
        };
      }
      return consulta;
    },
  );
  let pendiente: ReturnType<typeof enviar> | undefined;
  try {
    pendiente = enviar("PUT", `/api/metas/${meta._id}`, {
      minutosObjetivo: 77,
      diasPorSemana: 2,
    });
    await Promise.race([
      iniciada,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("PUT no llegó a la escritura")),
          3000,
        ).unref(),
      ),
    ]);
    await http("DELETE", `/api/metas/${meta._id}`, 204);
    liberar();
    assert.equal((await pendiente).status, 409);
    const guardada = await http("GET", `/api/metas/${meta._id}`, 200);
    assert.equal(guardada.activa, false);
    assert.equal(guardada.minutosObjetivo, objetivos.minutosObjetivo);
  } finally {
    liberar();
    try {
      await pendiente;
    } finally {
      interceptado.mock.restore();
    }
  }
});

test("Meta HTTP: PUT que gana antes de DELETE conserva edición e inactiva al final", async () => {
  const game = await juego();
  const meta = await crear(game._id);
  await http("PUT", `/api/metas/${meta._id}`, 200, {
    minutosObjetivo: 77,
    diasPorSemana: 2,
  });
  await http("DELETE", `/api/metas/${meta._id}`, 204);
  const guardada = await http("GET", `/api/metas/${meta._id}`, 200);
  assert.equal(guardada.minutosObjetivo, 77);
  assert.equal(guardada.activa, false);
});

test("T3 pendiente: el parser rechaza JSON escalar antes de validar Meta", async (t) => {
  await database!.assertConnection();
  const antes = await Meta.countDocuments();
  for (const body of ["null", "true", '"texto"']) {
    const response = await fetch(`${base}/api/metas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json();
    assert.equal(response.status, 500);
    assert.equal(result.requestId, undefined);
    assert.equal(response.headers.get("x-request-id"), null);
  }
  assert.equal(await Meta.countDocuments(), antes);
  t.diagnostic(
    "Caracterización de T3, no aceptación de 400 para cuerpos escalares; no se corrigió el parser.",
  );
});

test("Meta: índice ausente bloquea escrituras; duplicados impiden inicializar sin borrar datos", async () => {
  const game = await juego();
  await database!.assertConnection();
  const indice = (await Meta.collection.indexes()).find(
    (entry) => entry.unique && entry.key.videojuego === 1,
  );
  assert.ok(indice);
  await Meta.collection.dropIndex(indice.name!);
  try {
    const antes = await Meta.countDocuments();
    await http("POST", "/api/metas", 500, {
      videojuego: game._id,
      ...objetivos,
    });
    assert.equal(await Meta.countDocuments(), antes);
    await Meta.create([
      { videojuego: game._id, ...objetivos },
      { videojuego: game._id, ...objetivos },
    ]);
    await assert.rejects(inicializarMetas(), /índice/i);
    assert.equal(
      await Meta.countDocuments({ videojuego: game._id, activa: true }),
      2,
    );
  } finally {
    // Solo fixtures propios: el inicializador de producción no corrige duplicados.
    await Meta.updateMany(
      { videojuego: game._id },
      { $set: { activa: false } },
    );
    await inicializarMetas();
  }
});
