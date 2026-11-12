import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "../src/apiError";
import {
  validarCrearMeta,
  validarEditarMeta,
} from "../src/services/metas.service";

const base = {
  videojuego: "0123456789abcdef01234567",
  minutosObjetivo: 120,
  diasPorSemana: 3,
};
const es400 = (error: unknown) =>
  error instanceof ApiError && error.status === 400;

for (const valor of [undefined, null, false, 42, "texto", []]) {
  test(`DTO Meta: rechaza cuerpo ${String(valor)} antes de persistir`, () => {
    assert.throws(() => validarCrearMeta(valor), es400);
    assert.throws(() => validarEditarMeta(valor, new Set()), es400);
  });
}

for (const campo of ["minutosObjetivo", "diasPorSemana"] as const) {
  for (const valor of [
    NaN,
    Infinity,
    -Infinity,
    true,
    "1",
    null,
    undefined,
    1.5,
  ]) {
    test(`DTO Meta: ${campo} rechaza ${String(valor)}`, () => {
      assert.throws(() => validarCrearMeta({ ...base, [campo]: valor }), es400);
      assert.throws(
        () =>
          validarEditarMeta(
            { minutosObjetivo: 120, diasPorSemana: 3, [campo]: valor },
            new Set(),
          ),
        es400,
      );
    });
  }
}

test("DTO Meta: normaliza IDs y trim sin mutar la entrada", () => {
  const entrada = {
    ...base,
    videojuego: base.videojuego.toUpperCase(),
    hitos: [{ descripcion: "  Hito  ", porcentajeObjetivo: 50 }],
  };
  const salida = validarCrearMeta(entrada);
  assert.equal(salida.videojuego, base.videojuego);
  assert.equal(salida.hitos[0].descripcion, "Hito");
  assert.equal(entrada.hitos[0].descripcion, "  Hito  ");
});

test("DTO Meta: omitir hitos en edición difiere de enviarlos vacíos", () => {
  const valores = { minutosObjetivo: 120, diasPorSemana: 3 };
  assert.equal(validarEditarMeta(valores, new Set()).hitos, undefined);
  assert.deepEqual(
    validarEditarMeta({ ...valores, hitos: [] }, new Set()).hitos,
    [],
  );
});

test("DTO Meta: porcentaje no finito/booleano no alcanza el modelo", () => {
  for (const porcentajeObjetivo of [NaN, Infinity, -Infinity, true, null]) {
    assert.throws(
      () =>
        validarCrearMeta({
          ...base,
          hitos: [{ descripcion: "Hito", porcentajeObjetivo }],
        }),
      es400,
    );
  }
});

test("DTO Meta: un mismo ID con mayúsculas/minúsculas no evade unicidad", () => {
  const hito = {
    _id: base.videojuego,
    descripcion: "Hito",
    porcentajeObjetivo: 50,
  };
  assert.throws(
    () =>
      validarEditarMeta(
        {
          minutosObjetivo: 120,
          diasPorSemana: 3,
          hitos: [hito, { ...hito, _id: hito._id.toUpperCase() }],
        },
        new Set([hito._id]),
      ),
    es400,
  );
});
