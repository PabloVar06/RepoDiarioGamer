import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { Partida } from "../src/modelos/Partida.model";

const datos = {
  videojuego: new Types.ObjectId(),
  duracionMinutos: 90,
  porcentajeAvance: 25,
};

for (const dia of [
  "0001-01-01",
  "0099-12-31",
  "2000-02-29",
  "2024-02-29",
  "9999-12-31",
]) {
  test(`Partida: ${dia} admite día civil y Date interno sin cambiar el año`, () => {
    const original = new Date(`${dia}T00:00:00.000Z`);
    for (const fecha of [dia, original]) {
      const partida = new Partida({ ...datos, fecha });
      assert.equal(partida.validateSync(), undefined);
      assert.equal(partida.fecha.toISOString(), `${dia}T00:00:00.000Z`);
      assert.equal(partida.duracionMinutos, 90);
    }
    assert.equal(original.toISOString(), `${dia}T00:00:00.000Z`);
  });
}

const invalidas: [string, unknown][] = [
  ["día imposible", "2026-02-30"],
  ["año no bisiesto", "2025-02-29"],
  ["siglo no bisiesto", "1900-02-29"],
  ["año cero", "0000-01-01"],
  ["año fuera de rango", "10000-01-01"],
  ["mes sin dos dígitos", "2026-1-01"],
  ["timestamp UTC", "2026-11-15T00:00:00.000Z"],
  ["timestamp con desfase", "2026-11-15T23:30:00-05:00"],
  ["número", 0],
  ["booleano", true],
  ["objeto", {}],
  ["lista", []],
  ["vacía", ""],
  ["ausente", undefined],
  ["null", null],
  ["Date inválido", new Date(NaN)],
  ["Date interno con hora", new Date("2026-11-15T23:30:00Z")],
];

for (const [caso, fecha] of invalidas) {
  test(`Partida: rechaza fecha ${caso} sin convertirla en otro día`, () => {
    const partida = new Partida({ ...datos, fecha });
    assert.ok(partida.validateSync()?.errors.fecha);
  });
}
