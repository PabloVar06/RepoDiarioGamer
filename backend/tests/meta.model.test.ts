import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { Meta } from "../src/modelos/Meta.model";

function datos() {
  return {
    videojuego: new Types.ObjectId(),
    minutosObjetivo: 120,
    diasPorSemana: 3,
  };
}

test("Meta: activa por defecto y no necesita hitos", () => {
  const meta = new Meta(datos());
  assert.equal(meta.validateSync(), undefined);
  assert.equal(meta.activa, true);
  assert.equal(meta.hitos.length, 0);
});

for (const campo of ["videojuego", "minutosObjetivo", "diasPorSemana"]) {
  test(`Meta: ${campo} es obligatorio`, () => {
    const meta = new Meta({ ...datos(), [campo]: undefined });
    assert.ok(meta.validateSync()?.errors[campo]);
  });
}

for (const valor of [0, -1, 6001, 1.5, NaN, Infinity, null]) {
  test(`Meta: minutosObjetivo rechaza ${String(valor)}`, () => {
    const meta = new Meta({ ...datos(), minutosObjetivo: valor });
    assert.ok(meta.validateSync()?.errors.minutosObjetivo);
  });
}

for (const valor of [0, -1, 8, 1.5, NaN, Infinity, null]) {
  test(`Meta: diasPorSemana rechaza ${String(valor)}`, () => {
    const meta = new Meta({ ...datos(), diasPorSemana: valor });
    assert.ok(meta.validateSync()?.errors.diasPorSemana);
  });
}

for (const [minutosObjetivo, diasPorSemana] of [
  [1, 1],
  [6000, 7],
]) {
  test(`Meta: admite límites ${minutosObjetivo} minutos y ${diasPorSemana} días`, () => {
    const meta = new Meta({ ...datos(), minutosObjetivo, diasPorSemana });
    assert.equal(meta.validateSync(), undefined);
  });
}

test("Meta: la referencia rechaza un ObjectId mal formado", () => {
  assert.ok(
    new Meta({ ...datos(), videojuego: "invalido" }).validateSync()?.errors
      .videojuego,
  );
});

test("Meta: activa no admite null y permite metas históricas inactivas", () => {
  assert.ok(
    new Meta({ ...datos(), activa: null }).validateSync()?.errors.activa,
  );
  assert.equal(
    new Meta({ ...datos(), activa: false }).validateSync(),
    undefined,
  );
});

test("Meta: admite cinco hitos con IDs propios y descripción recortada", () => {
  const meta = new Meta({
    ...datos(),
    hitos: Array.from({ length: 5 }, (_, i) => ({
      descripcion: i === 0 ? "  Primer paso  " : "x".repeat(120),
      porcentajeObjetivo: i === 0 ? 1 : 100,
    })),
  });
  assert.equal(meta.validateSync(), undefined);
  assert.equal(meta.hitos[0].descripcion, "Primer paso");
  assert.equal(new Set(meta.hitos.map((hito) => hito._id.toString())).size, 5);
});

test("Meta: rechaza más de cinco hitos y una lista null", () => {
  const hitos = Array.from({ length: 6 }, () => ({
    descripcion: "Hito",
    porcentajeObjetivo: 50,
  }));
  assert.ok(new Meta({ ...datos(), hitos }).validateSync()?.errors.hitos);
  assert.ok(new Meta({ ...datos(), hitos: null }).validateSync()?.errors.hitos);
});

for (const descripcion of [undefined, "", "   ", "x".repeat(121)]) {
  test(`Meta: rechaza descripción de hito ${descripcion === undefined ? "omitida" : `de longitud ${descripcion.length}`}`, () => {
    const meta = new Meta({
      ...datos(),
      hitos: [{ descripcion, porcentajeObjetivo: 50 }],
    });
    assert.ok(meta.validateSync()?.errors["hitos.0.descripcion"]);
  });
}

for (const porcentajeObjetivo of [
  undefined,
  0,
  101,
  1.5,
  NaN,
  Infinity,
  null,
]) {
  test(`Meta: rechaza porcentaje de hito ${String(porcentajeObjetivo)}`, () => {
    const meta = new Meta({
      ...datos(),
      hitos: [{ descripcion: "Hito", porcentajeObjetivo }],
    });
    assert.ok(meta.validateSync()?.errors["hitos.0.porcentajeObjetivo"]);
  });
}
