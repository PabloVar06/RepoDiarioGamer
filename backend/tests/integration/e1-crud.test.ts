import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Types } from "mongoose";
import { crearApp } from "../../src/app";
import { startTemporaryMongo } from "./temporary-mongo";

let database: Awaited<ReturnType<typeof startTemporaryMongo>> | undefined;
let server: Server | undefined;
let base: string;

before(
  async () => {
    database = await startTemporaryMongo();
    await database.assertConnection();
    server = crearApp({ frontendUrl: "http://frontend.example.test" }).listen(
      0,
      "127.0.0.1",
    );
    await once(server, "listening");
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  },
  { timeout: 240_000 },
);

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

async function request(
  method: string,
  path: string,
  expected: number,
  body?: unknown,
) {
  // Revalidar propiedad/conexión antes de CADA petición, incluidas las bajas.
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
  assert.equal(response.status, expected, `${method} ${path}: ${text}`);
  if (expected === 204) {
    assert.equal(text, "");
    return null;
  }
  const result = JSON.parse(text);
  if (expected >= 400) {
    assert.equal(typeof result.error, "string");
    assert.match(result.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(response.headers.get("x-request-id"), result.requestId);
  }
  return result;
}

const validGame = {
  nombre: "Juego de prueba",
  plataforma: "PC",
  genero: "Rol",
  logros: [{ nombre: "Primer paso" }],
};
const validSession = {
  fecha: "2026-11-09",
  duracionMinutos: 60,
  porcentajeAvance: 25,
  notas: "Sesión sintética",
};
const newId = () => new Types.ObjectId().toHexString();
const game = (nombre: string) =>
  request("POST", "/api/videojuegos", 201, { ...validGame, nombre });
const session = (id: string, overrides: Record<string, unknown> = {}) =>
  request("POST", "/api/partidas", 201, {
    ...validSession,
    videojuego: id,
    ...overrides,
  });

test("E1 HTTP: CRUD de videojuegos, filtro y persistencia de cambios", async () => {
  const created = await game("  E1 Zelda  ");
  assert.equal(created.nombre, "E1 Zelda");
  assert.equal(created.estado, "Jugando");
  assert.equal(created.logros[0].obtenido, false);
  const path = `/api/videojuegos/${created._id}`;
  const detail = await request("GET", path, 200);
  assert.equal(detail._id, created._id);
  assert.equal(detail.logros[0]._id, created.logros[0]._id);
  assert.equal(typeof detail.createdAt, "string");
  const filtered = await request("GET", "/api/videojuegos?filtro=zelda", 200);
  assert.deepEqual(
    filtered.map((item: { _id: string }) => item._id),
    [created._id],
  );

  const edited = await request("PUT", path, 200, {
    nombre: "E1 Zelda editado",
    plataforma: "Switch",
    genero: "Accion",
    estado: "Pausado",
  });
  assert.equal(edited.estado, "Pausado");
  const saved = await request("GET", path, 200);
  assert.equal(saved.nombre, "E1 Zelda editado");
  assert.equal(saved.plataforma, "Switch");
  assert.equal(saved.genero, "Accion");
  assert.equal(saved.logros[0]._id, created.logros[0]._id);
  await request("DELETE", path, 204);
  await request("GET", path, 404);
  assert.deepEqual(
    await request("GET", "/api/videojuegos?filtro=Zelda", 200),
    [],
  );
});

test("E1 HTTP: partidas relacionadas, historial poblado y baja individual aislada", async () => {
  const first = await game("Relaciones A");
  const other = await game("Relaciones B");
  const firstSession = await session(first._id);
  const otherSession = await session(other._id);
  assert.equal(firstSession.videojuego, first._id);
  assert.equal(firstSession.fecha, "2026-11-09T00:00:00.000Z");
  const all = await request("GET", "/api/partidas", 200);
  const populated = all.find(
    (item: { _id: string }) => item._id === firstSession._id,
  );
  assert.equal(populated.videojuego._id, first._id);
  assert.equal(populated.videojuego.nombre, first.nombre);
  const history = await request(
    "GET",
    `/api/videojuegos/${first._id}/partidas`,
    200,
  );
  assert.deepEqual(
    history.map((item: { _id: string }) => item._id),
    [firstSession._id],
  );
  await request("DELETE", `/api/partidas/${firstSession._id}`, 204);
  assert.deepEqual(
    await request("GET", `/api/videojuegos/${first._id}/partidas`, 200),
    [],
  );
  const untouched = await request(
    "GET",
    `/api/videojuegos/${other._id}/partidas`,
    200,
  );
  assert.deepEqual(
    untouched.map((item: { _id: string }) => item._id),
    [otherSession._id],
  );
  await request("GET", `/api/videojuegos/${first._id}`, 200);
  await request("GET", `/api/videojuegos/${other._id}`, 200);
  await request("DELETE", `/api/partidas/${firstSession._id}`, 404);
});

test("E1 HTTP: logros se marcan y desmarcan sin modificar otros logros", async () => {
  const created = await request("POST", "/api/videojuegos", 201, {
    ...validGame,
    nombre: "Logros",
    logros: [{ nombre: "Primero" }, { nombre: "Segundo" }],
  });
  const path = `/api/videojuegos/${created._id}/logros/${created.logros[0]._id}`;
  const marked = await request("PATCH", path, 200, { obtenido: true });
  assert.equal(marked.logros[0].obtenido, true);
  assert.equal(marked.logros[1].obtenido, false);
  assert.equal(
    (await request("GET", `/api/videojuegos/${created._id}`, 200)).logros[0]
      .obtenido,
    true,
  );
  await request("PATCH", path, 200, { obtenido: false });
  const saved = await request("GET", `/api/videojuegos/${created._id}`, 200);
  assert.equal(saved.logros[0].obtenido, false);
  assert.equal(saved.logros[0]._id, created.logros[0]._id);
});

test("E1 HTTP: resumen usa máximo avance, orden, redondeo y recálculo tras bajas", async () => {
  const created = await game("Resumen");
  const path = `/api/videojuegos/${created._id}/resumen`;
  const empty = {
    totalPartidas: 0,
    horasTotales: 0,
    ultimaPartida: null,
    porcentajeAvanceActual: 0,
  };
  assert.deepEqual(await request("GET", path, 200), empty);
  const maximum = await session(created._id, {
    fecha: "2026-11-09",
    duracionMinutos: 60,
    porcentajeAvance: 80,
  });
  const middle = await session(created._id, {
    fecha: "2026-11-10",
    duracionMinutos: 90,
    porcentajeAvance: 30,
  });
  const latest = await session(created._id, {
    fecha: "2026-11-11",
    duracionMinutos: 30,
    porcentajeAvance: 70,
  });
  assert.deepEqual(await request("GET", path, 200), {
    totalPartidas: 3,
    horasTotales: 3,
    ultimaPartida: "2026-11-11T00:00:00.000Z",
    porcentajeAvanceActual: 80,
  });
  const history = await request(
    "GET",
    `/api/videojuegos/${created._id}/partidas`,
    200,
  );
  assert.deepEqual(
    history.map((item: { _id: string }) => item._id),
    [latest._id, middle._id, maximum._id],
  );
  await request("DELETE", `/api/partidas/${maximum._id}`, 204);
  assert.equal((await request("GET", path, 200)).porcentajeAvanceActual, 70);
  await request("DELETE", `/api/partidas/${latest._id}`, 204);
  assert.deepEqual(await request("GET", path, 200), {
    totalPartidas: 1,
    horasTotales: 1.5,
    ultimaPartida: "2026-11-10T00:00:00.000Z",
    porcentajeAvanceActual: 30,
  });
  await request("DELETE", `/api/partidas/${middle._id}`, 204);
  const minute = await session(created._id, {
    duracionMinutos: 1,
    porcentajeAvance: 0,
  });
  assert.equal((await request("GET", path, 200)).horasTotales, 0.02);
  await request("DELETE", `/api/partidas/${minute._id}`, 204);
  assert.deepEqual(await request("GET", path, 200), empty);
});

test("E1 HTTP: cascada elimina solo partidas del juego borrado y conserva el otro", async () => {
  const removed = await game("Cascada A");
  const kept = await game("Cascada B");
  const first = await session(removed._id);
  const second = await session(removed._id);
  const survivor = await session(kept._id, {
    duracionMinutos: 120,
    porcentajeAvance: 90,
  });
  const before = await request("GET", `/api/videojuegos/${kept._id}`, 200);
  await request("DELETE", `/api/videojuegos/${removed._id}`, 204);
  await request("GET", `/api/videojuegos/${removed._id}`, 404);
  await request("GET", `/api/videojuegos/${removed._id}/partidas`, 404);
  const remaining = await request("GET", "/api/partidas", 200);
  const ids = remaining.map((item: { _id: string }) => item._id);
  assert.ok(!ids.includes(first._id) && !ids.includes(second._id));
  assert.ok(ids.includes(survivor._id));
  await request("DELETE", `/api/partidas/${first._id}`, 404);
  assert.deepEqual(
    await request("GET", `/api/videojuegos/${kept._id}`, 200),
    before,
  );
  assert.deepEqual(
    await request("GET", `/api/videojuegos/${kept._id}/resumen`, 200),
    {
      totalPartidas: 1,
      horasTotales: 2,
      ultimaPartida: "2026-11-09T00:00:00.000Z",
      porcentajeAvanceActual: 90,
    },
  );
});

test("E1 HTTP: validaciones 400 no crean documentos ni persisten ediciones inválidas", async (t) => {
  const created = await game("Validaciones");
  const gamesBefore = await request("GET", "/api/videojuegos", 200);
  const sessionsBefore = await request("GET", "/api/partidas", 200);
  const invalidGames: Array<[string, Record<string, unknown>]> = [
    ["nombre vacío", { nombre: "   " }],
    ["nombre largo", { nombre: "a".repeat(121) }],
    ["plataforma ausente", { plataforma: null }],
    ["plataforma inválida", { plataforma: "pc" }],
    ["género ausente", { genero: null }],
    ["género inválido", { genero: "terror" }],
    ["estado inválido", { estado: "Terminado" }],
    ["logro sin nombre", { logros: [{}] }],
    ["logro largo", { logros: [{ nombre: "a".repeat(101) }] }],
  ];
  for (const [name, override] of invalidGames) {
    await t.test(`POST videojuego: ${name}`, async () => {
      await request("POST", "/api/videojuegos", 400, {
        ...validGame,
        ...override,
      });
    });
  }
  await t.test("POST videojuego sin campos", async () => {
    await request("POST", "/api/videojuegos", 400, {});
  });
  await t.test("PUT inválido conserva juego persistido", async () => {
    await request("PUT", `/api/videojuegos/${created._id}`, 400, {
      nombre: "Mutación rechazada",
      plataforma: "pc",
    });
    assert.deepEqual(
      await request("GET", `/api/videojuegos/${created._id}`, 200),
      created,
    );
  });
  const invalidSessions: Array<[string, Record<string, unknown>]> = [
    ["sin referencia", { videojuego: null }],
    ["referencia mal formada", { videojuego: "incorrecto" }],
    ["referencia de otro tipo", { videojuego: 123 }],
    ["fecha ausente", { fecha: null }],
    ["fecha inválida", { fecha: "no-es-fecha" }],
    ["duración ausente", { duracionMinutos: null }],
    ["duración cero", { duracionMinutos: 0 }],
    ["duración excesiva", { duracionMinutos: 1441 }],
    ["avance ausente", { porcentajeAvance: null }],
    ["avance negativo", { porcentajeAvance: -1 }],
    ["avance excesivo", { porcentajeAvance: 101 }],
    ["notas largas", { notas: "a".repeat(1001) }],
  ];
  for (const [name, override] of invalidSessions) {
    await t.test(`POST partida: ${name}`, async () => {
      await request("POST", "/api/partidas", 400, {
        ...validSession,
        videojuego: created._id,
        ...override,
      });
    });
  }
  await t.test("POST partida sin campos", async () => {
    await request("POST", "/api/partidas", 400, {});
  });
  for (const [name, logroId, body] of [
    ["ID inválido", "incorrecto", { obtenido: true }],
    ["booleano inválido", created.logros[0]._id, { obtenido: "true" }],
    ["booleano ausente", created.logros[0]._id, {}],
  ] as const) {
    await t.test(`PATCH logro: ${name}`, async () => {
      await request(
        "PATCH",
        `/api/videojuegos/${created._id}/logros/${logroId}`,
        400,
        body,
      );
    });
  }
  assert.deepEqual(await request("GET", "/api/videojuegos", 200), gamesBefore);
  assert.deepEqual(await request("GET", "/api/partidas", 200), sessionsBefore);
});

test("E1 HTTP: extremos válidos de esquemas se guardan", async () => {
  const created = await request("POST", "/api/videojuegos", 201, {
    nombre: "a".repeat(120),
    plataforma: "Movil",
    genero: "Terror",
    estado: "Abandonado",
    logros: [{ nombre: "a".repeat(100) }],
  });
  const lower = await session(created._id, {
    duracionMinutos: 1,
    porcentajeAvance: 0,
  });
  const upper = await session(created._id, {
    duracionMinutos: 1440,
    porcentajeAvance: 100,
    notas: "a".repeat(1000),
  });
  assert.equal(lower.duracionMinutos, 1);
  assert.equal(lower.porcentajeAvance, 0);
  assert.equal(upper.duracionMinutos, 1440);
  assert.equal(upper.porcentajeAvance, 100);
  assert.equal(upper.notas.length, 1000);
  const saved = await request(
    "GET",
    `/api/videojuegos/${created._id}/partidas`,
    200,
  );
  assert.equal(saved.length, 2);
});

test("E1 HTTP: IDs mal formados son 400 y recursos inexistentes son 404", async (t) => {
  for (const [label, id, status] of [
    ["mal formado", "incorrecto", 400],
    ["inexistente", newId(), 404],
  ] as const) {
    for (const [method, suffix, body] of [
      ["GET", "", undefined],
      ["PUT", "", { nombre: "Sin crear" }],
      ["DELETE", "", undefined],
      ["GET", "/partidas", undefined],
      ["GET", "/resumen", undefined],
      ["PATCH", `/logros/${newId()}`, { obtenido: true }],
    ] as const) {
      await t.test(
        `Videojuego ${label}: ${method} ${suffix || "/:id"}`,
        async () => {
          await request(
            method,
            `/api/videojuegos/${id}${suffix}`,
            status,
            body,
          );
        },
      );
    }
    await t.test(`DELETE partida: ${label}`, async () => {
      await request("DELETE", `/api/partidas/${id}`, status);
    });
  }
  await t.test("crear partida de juego inexistente es 404", async () => {
    await request("POST", "/api/partidas", 404, {
      ...validSession,
      videojuego: newId(),
    });
  });
  const created = await game("Logro inexistente");
  await t.test("logro inexistente es 404", async () => {
    await request(
      "PATCH",
      `/api/videojuegos/${created._id}/logros/${newId()}`,
      404,
      { obtenido: true },
    );
  });
  await t.test("ruta ajena es 404", async () => {
    await request("GET", "/api/no-existe", 404);
  });
});

test("T3 pendiente: observar JSON malformado sin corregir su respuesta actual", async (t) => {
  assert.ok(database);
  await database.assertConnection();
  const before = await request("GET", "/api/videojuegos", 200);
  const response = await fetch(`${base}/api/videojuegos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"nombre":',
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json();
  // Es una caracterización de deuda, NO aceptación del contrato deseado de E2.
  assert.equal(response.status, 500);
  assert.equal(body.error, "Error interno del servidor");
  assert.equal(body.requestId, undefined);
  assert.equal(response.headers.get("x-request-id"), null);
  assert.deepEqual(await request("GET", "/api/videojuegos", 200), before);
  t.diagnostic(
    "T3 sigue pendiente: JSON malformado devuelve 500 sin requestId; no se modificó E1.",
  );
});
