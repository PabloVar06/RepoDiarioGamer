import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fechaCivilUTC,
  obtenerFechaLocal,
  obtenerSemana,
} from "../src/services/fechas";

for (const dia of ["0001-01-01", "0099-12-31", "2000-02-29", "9999-12-31"]) {
  test(`Fecha civil: ${dia} conserva año y día a medianoche UTC`, () => {
    assert.equal(fechaCivilUTC(dia).toISOString(), `${dia}T00:00:00.000Z`);
  });
}

for (const dia of [
  "2026-02-30",
  "2025-02-29",
  "0000-01-01",
  "10000-01-01",
  "2026-11-15T23:30:00-05:00",
]) {
  test(`Fecha civil: rechaza ${dia} en vez de normalizarlo`, () => {
    assert.throws(() => fechaCivilUTC(dia));
  });
}

test("Calendario: hoy cambia a las 05:00 UTC de Guayaquil", () => {
  assert.equal(
    obtenerFechaLocal(new Date("2026-11-16T04:59:59.999Z")),
    "2026-11-15",
  );
  assert.equal(
    obtenerFechaLocal(new Date("2026-11-16T05:00:00.000Z")),
    "2026-11-16",
  );
});

for (const [dia, inicio, fin] of [
  ["2026-11-09", "2026-11-09", "2026-11-15"],
  ["2026-11-15", "2026-11-09", "2026-11-15"],
  ["2026-11-16", "2026-11-16", "2026-11-22"],
  ["2027-01-01", "2026-12-28", "2027-01-03"],
  ["2024-02-29", "2024-02-26", "2024-03-03"],
  ["0001-01-01", "0001-01-01", "0001-01-07"],
  ["0099-01-01", "0098-12-29", "0099-01-04"],
]) {
  test(`Calendario: semana civil de ${dia}`, () => {
    assert.deepEqual(obtenerSemana(dia), { inicio, fin });
  });
}

for (const dia of [
  "2026-02-30",
  "2025-02-29",
  "1900-02-29",
  "0000-01-01",
  "2026-13-01",
  "2026-1-01",
  "2026-11-09T00:00:00Z",
  "",
]) {
  test(`Calendario: no normaliza silenciosamente ${dia}`, () => {
    assert.throws(() => obtenerSemana(dia));
  });
}

test("Calendario: 2000 sí es bisiesto y un instante inválido falla", () => {
  assert.deepEqual(obtenerSemana("2000-02-29"), {
    inicio: "2000-02-28",
    fin: "2000-03-05",
  });
  assert.throws(() => obtenerFechaLocal(new Date(NaN)));
});

test("Calendario: la zona del proceso no altera Guayaquil ni la semana", () => {
  const anterior = process.env.TZ;
  try {
    for (const zona of [
      "UTC",
      "America/Guayaquil",
      "Asia/Tokyo",
      "America/Los_Angeles",
    ]) {
      process.env.TZ = zona;
      const dia = obtenerFechaLocal(new Date("2026-11-16T04:59:00Z"));
      assert.equal(dia, "2026-11-15");
      assert.deepEqual(obtenerSemana(dia), {
        inicio: "2026-11-09",
        fin: "2026-11-15",
      });
    }
  } finally {
    if (anterior === undefined) delete process.env.TZ;
    else process.env.TZ = anterior;
  }
});
