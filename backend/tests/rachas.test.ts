import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularRachasGlobales } from "../src/services/rachas.calculos";
import { obtenerFechaLocal } from "../src/services/fechas";

for (const [nombre, fechas, hoy, actual, mejor] of [
  ["sin partidas", [], "2026-11-11", 0, 0],
  ["hoy", ["2026-11-11"], "2026-11-11", 1, 1],
  ["ayer", ["2026-11-09", "2026-11-10"], "2026-11-11", 2, 2],
  [
    "día terminado sin actividad",
    ["2026-11-09", "2026-11-10"],
    "2026-11-12",
    0,
    2,
  ],
  [
    "secuencia nueva",
    ["2026-11-07", "2026-11-08", "2026-11-09", "2026-11-11"],
    "2026-11-11",
    1,
    3,
  ],
  [
    "deduplicación y orden",
    ["2026-11-11", "2026-11-10", "2026-11-11", "2026-11-09"],
    "2026-11-11",
    3,
    3,
  ],
  ["cruce de año", ["2025-12-31", "2026-01-01"], "2026-01-02", 2, 2],
  ["bisiesto", ["2024-02-28", "2024-02-29", "2024-03-01"], "2024-03-01", 3, 3],
  ["años 0099/0100", ["0099-12-31", "0100-01-01"], "0100-01-01", 2, 2],
  [
    "futuras excluidas",
    ["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"],
    "2026-11-11",
    2,
    2,
  ],
] as const) {
  test(`Rachas puras: ${nombre}`, () => {
    const entrada = Object.freeze([...fechas]);
    assert.deepEqual(calcularRachasGlobales(entrada, hoy), {
      rachaActual: actual,
      mejorRacha: mejor,
    });
    assert.deepEqual(entrada, fechas);
  });
}
test("Rachas puras: borrar historial puede reducir ambas rachas", () => {
  assert.deepEqual(
    calcularRachasGlobales(
      ["2026-11-09", "2026-11-10", "2026-11-11"],
      "2026-11-11",
    ),
    { rachaActual: 3, mejorRacha: 3 },
  );
  assert.deepEqual(
    calcularRachasGlobales(["2026-11-09", "2026-11-11"], "2026-11-11"),
    { rachaActual: 1, mejorRacha: 1 },
  );
});
for (const fecha of ["2026-02-30", "0000-01-01", "2026-11-11T00:00:00Z", ""]) {
  test(`Rachas puras: fecha inválida ${JSON.stringify(fecha)} no inventa ceros`, () => {
    assert.throws(() => calcularRachasGlobales([fecha], "2026-11-11"));
    assert.throws(() => calcularRachasGlobales([], fecha));
  });
}
for (const zona of [
  "UTC",
  "America/Guayaquil",
  "Asia/Tokyo",
  "America/Los_Angeles",
]) {
  test(`Rachas puras: TZ ${zona} no altera el corte Guayaquil`, () => {
    const anterior = process.env.TZ;
    try {
      process.env.TZ = zona;
      const fechas = ["2026-11-09", "2026-11-10"];
      assert.equal(
        calcularRachasGlobales(
          fechas,
          obtenerFechaLocal(new Date("2026-11-12T04:59:59.999Z")),
        ).rachaActual,
        2,
      );
      assert.equal(
        calcularRachasGlobales(
          fechas,
          obtenerFechaLocal(new Date("2026-11-12T05:00:00.000Z")),
        ).rachaActual,
        0,
      );
    } finally {
      if (anterior === undefined) delete process.env.TZ;
      else process.env.TZ = anterior;
    }
  });
}
