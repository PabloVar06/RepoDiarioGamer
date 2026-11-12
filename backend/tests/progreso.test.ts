import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcularActividadSemanal,
  calcularCumplimiento,
  calcularAvanceMaximo,
  evaluarHitos,
} from "../src/services/progreso.calculos";

const semana = { inicio: "2026-11-09", fin: "2026-11-15" };

test("Actividad: suma sesiones y deduplica días dentro de límites inclusivos", () => {
  const partidas = Object.freeze([
    Object.freeze({ fecha: "2026-11-08", duracionMinutos: 200 }),
    Object.freeze({ fecha: "2026-11-09", duracionMinutos: 30 }),
    Object.freeze({ fecha: "2026-11-09", duracionMinutos: 60 }),
    Object.freeze({ fecha: "2026-11-15", duracionMinutos: 15 }),
    Object.freeze({ fecha: "2026-11-16", duracionMinutos: 200 }),
  ]);
  assert.deepEqual(calcularActividadSemanal(partidas, semana, "2026-11-15"), {
    minutosSemana: 105,
    horasSemana: 1.75,
    diasJugados: 2,
  });
  assert.deepEqual(calcularActividadSemanal(partidas, semana, "2026-11-11"), {
    minutosSemana: 90,
    horasSemana: 1.5,
    diasJugados: 1,
  });
});

test("Actividad: sin partidas devuelve ceros y no redondea minutos heredados", () => {
  assert.deepEqual(calcularActividadSemanal([], semana, "2026-11-15"), {
    minutosSemana: 0,
    horasSemana: 0,
    diasJugados: 0,
  });
  const actividad = calcularActividadSemanal(
    [{ fecha: "2026-11-09", duracionMinutos: 1.5 }],
    semana,
    "2026-11-15",
  );
  assert.equal(actividad.horasSemana, 0.025);
});

for (const partida of [
  { fecha: "2026-02-30", duracionMinutos: 60 },
  { fecha: "2026-11-09", duracionMinutos: NaN },
  { fecha: "2026-11-09", duracionMinutos: Infinity },
  { fecha: "2026-11-09", duracionMinutos: 0 },
]) {
  test(`Actividad: falla ante dato no interpretable ${String(partida.duracionMinutos)}/${partida.fecha}`, () => {
    assert.throws(() =>
      calcularActividadSemanal([partida], semana, "2026-11-15"),
    );
  });
}

test("Cumplimiento: sin meta no inventa un porcentaje ni un estado", () => {
  assert.deepEqual(
    calcularCumplimiento({ minutosSemana: 420, diasJugados: 2 }, null),
    { porcentajeHoras: null, metaCumplida: null },
  );
});

for (const [minutosSemana, diasJugados, porcentajeHoras, metaCumplida] of [
  [0, 0, 0, false],
  [420, 2, 140, false],
  [300, 3, 100, true],
  [420, 3, 140, true],
  [150, 4, 50, false],
] as const) {
  test(`Cumplimiento: ${minutosSemana} minutos / ${diasJugados} días requiere ambas condiciones`, () => {
    assert.deepEqual(
      calcularCumplimiento(
        { minutosSemana, diasJugados },
        { minutosObjetivo: 300, diasPorSemana: 3 },
      ),
      { porcentajeHoras, metaCumplida },
    );
  });
}

test("Cumplimiento: no redondea un valor inferior al objetivo", () => {
  const resultado = calcularCumplimiento(
    { minutosSemana: 299.999, diasJugados: 3 },
    { minutosObjetivo: 300, diasPorSemana: 3 },
  );
  assert.ok(resultado.porcentajeHoras! < 100);
  assert.equal(resultado.metaCumplida, false);
});

test("Hitos: usa máximo acumulado, no última sesión ni semana; no muta entradas", () => {
  const hitos = Object.freeze([
    Object.freeze({ _id: "a", descripcion: "Inicio", porcentajeObjetivo: 75 }),
    Object.freeze({ _id: "b", descripcion: "Final", porcentajeObjetivo: 100 }),
  ]);
  const maximo = calcularAvanceMaximo([
    { porcentajeAvance: 80 },
    { porcentajeAvance: 30 },
    { porcentajeAvance: 70 },
  ]);
  assert.equal(maximo, 80);
  assert.deepEqual(evaluarHitos(hitos, maximo), [
    { ...hitos[0], alcanzado: true },
    { ...hitos[1], alcanzado: false },
  ]);
  assert.equal(
    evaluarHitos(
      hitos,
      calcularAvanceMaximo([
        { porcentajeAvance: 30 },
        { porcentajeAvance: 70 },
      ]),
    )[0].alcanzado,
    false,
  );
  assert.equal(evaluarHitos(hitos, 75)[0].alcanzado, true);
  assert.equal(calcularAvanceMaximo([]), 0);
  assert.deepEqual(evaluarHitos([], 0), []);
});

test("Dominio: objetivos y avances corruptos fallan de forma explícita", () => {
  assert.throws(() =>
    calcularCumplimiento(
      { minutosSemana: 60, diasJugados: 1 },
      { minutosObjetivo: 0, diasPorSemana: 1 },
    ),
  );
  assert.throws(() => calcularAvanceMaximo([{ porcentajeAvance: NaN }]));
  assert.throws(() =>
    evaluarHitos(
      [{ _id: "a", descripcion: "Hito", porcentajeObjetivo: 101 }],
      80,
    ),
  );
});
