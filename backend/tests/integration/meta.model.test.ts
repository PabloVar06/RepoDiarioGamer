import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { Types } from "mongoose";
import { Meta } from "../../src/modelos/Meta.model";
import { Videojuego } from "../../src/modelos/Videojuego.model";
import { startTemporaryMongo } from "./temporary-mongo";

let database: Awaited<ReturnType<typeof startTemporaryMongo>> | undefined;

async function comprobarAislamiento() {
  assert.ok(database);
  await database.assertConnection();
}

async function comprobarIndice() {
  const indices = await Meta.collection.indexes();
  const indice = indices.find((entry) => entry.key.videojuego === 1);
  assert.ok(indice, "Debe existir el índice antes de escribir metas");
  assert.deepEqual(indice.key, { videojuego: 1 });
  assert.equal(indice.unique, true);
  assert.deepEqual(indice.partialFilterExpression, { activa: true });
}

before(
  async () => {
    database = await startTemporaryMongo();
    await comprobarAislamiento();
    await Meta.createCollection();
    await Meta.createIndexes();
    await comprobarIndice();
  },
  { timeout: 240_000 },
);

after(async () => {
  await database?.close();
});

async function crearJuego() {
  await comprobarAislamiento();
  return Videojuego.create({
    nombre: "Juego de prueba Meta",
    plataforma: "PC",
    genero: "Rol",
  });
}

function datos(videojuego: Types.ObjectId) {
  return { videojuego, minutosObjetivo: 120, diasPorSemana: 3 };
}

test("Meta: el índice real es único y parcial por activa", async () => {
  await comprobarAislamiento();
  await comprobarIndice();
});

test("Meta: dos creaciones activas concurrentes dejan una sola y error 11000", async () => {
  const juego = await crearJuego();
  const resultados = await Promise.allSettled([
    Meta.create(datos(juego._id)),
    Meta.create(datos(juego._id)),
  ]);
  assert.equal(resultados.filter((r) => r.status === "fulfilled").length, 1);
  const rechazo = resultados.find((r) => r.status === "rejected");
  assert.ok(rechazo?.status === "rejected");
  assert.equal(rechazo.reason.code, 11000);
  assert.deepEqual(rechazo.reason.keyPattern, { videojuego: 1 });
  assert.equal(
    await Meta.countDocuments({ videojuego: juego._id, activa: true }),
    1,
  );
});

test("Meta: juegos diferentes pueden tener su propia meta activa", async () => {
  const primero = await crearJuego();
  const segundo = await crearJuego();
  await Promise.all([
    Meta.create(datos(primero._id)),
    Meta.create(datos(segundo._id)),
  ]);
  for (const juego of [primero, segundo]) {
    assert.equal(
      await Meta.countDocuments({ videojuego: juego._id, activa: true }),
      1,
    );
  }
});

test("Meta: varias históricas inactivas conviven con una activa", async () => {
  const juego = await crearJuego();
  await Meta.create([
    { ...datos(juego._id), activa: false },
    { ...datos(juego._id), activa: false },
    datos(juego._id),
  ]);
  assert.equal(
    await Meta.countDocuments({ videojuego: juego._id, activa: false }),
    2,
  );
  assert.equal(
    await Meta.countDocuments({ videojuego: juego._id, activa: true }),
    1,
  );
});

test("Meta: desactivar permite otra activa sin borrar la anterior ni otro juego", async () => {
  const juego = await crearJuego();
  const otroJuego = await crearJuego();
  const anterior = await Meta.create(datos(juego._id));
  const ajena = await Meta.create(datos(otroJuego._id));
  anterior.activa = false;
  await anterior.save();
  const nueva = await Meta.create(datos(juego._id));
  assert.ok(!nueva._id.equals(anterior._id));
  assert.equal((await Meta.findById(anterior._id))?.activa, false);
  assert.equal(await Meta.countDocuments({ videojuego: juego._id }), 2);
  assert.equal((await Meta.findById(ajena._id))?.activa, true);
});

test("Meta: persiste timestamps, IDs de hitos y referencia inmutable sin versionKey", async () => {
  const juego = await crearJuego();
  const otroJuego = await crearJuego();
  const meta = await Meta.create({
    ...datos(juego._id),
    hitos: [{ descripcion: "Inicio", porcentajeObjetivo: 25 }],
  });
  const idHito = meta.hitos[0]._id.toString();
  const creacion = meta.createdAt.getTime();
  meta.videojuego = otroJuego._id;
  meta.hitos[0].descripcion = "Inicio revisado";
  await meta.save();
  const guardada = await Meta.findById(meta._id).orFail();
  assert.ok(guardada.videojuego.equals(juego._id));
  assert.equal(guardada.hitos[0]._id.toString(), idHito);
  assert.equal(guardada.hitos[0].descripcion, "Inicio revisado");
  assert.ok(guardada.createdAt instanceof Date);
  assert.ok(guardada.updatedAt instanceof Date);
  assert.equal(guardada.createdAt.getTime(), creacion);
  assert.ok(guardada.updatedAt.getTime() >= creacion);
  assert.equal(
    Object.prototype.hasOwnProperty.call(guardada.toObject(), "__v"),
    false,
  );
});
