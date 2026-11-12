import { expect, expectTypeOf, test, vi } from "vitest";
import { ErrorApi, metasApi } from "./metasApi";
import * as baseUrl from "./baseUrl";
import type { MetaDTO, ProgresoJuegoDTO } from "../tipos";

const juegoId = "0123456789abcdef01234567";
const meta: MetaDTO = {
  _id: "1123456789abcdef01234567",
  videojuego: juegoId,
  minutosObjetivo: 300,
  diasPorSemana: 3,
  activa: true,
  hitos: [
    {
      _id: "2123456789abcdef01234567",
      descripcion: "Avance",
      porcentajeObjetivo: 75,
    },
  ],
  createdAt: "2026-11-11T17:00:00.000Z",
  updatedAt: "2026-11-11T17:00:00.000Z",
};

function progreso(): ProgresoJuegoDTO {
  return {
    videojuego: juegoId,
    zonaHoraria: "America/Guayaquil",
    fechaLocalActual: "2026-11-11",
    semana: { inicio: "2026-11-09", fin: "2026-11-15" },
    minutosSemana: 420,
    horasSemana: 7,
    diasJugados: 2,
    porcentajeAvanceActual: 80,
    meta: structuredClone(meta),
    porcentajeHoras: 140,
    metaCumplida: false,
    hitos: [{ ...meta.hitos[0], alcanzado: true }],
  };
}

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), { status, headers });

test("FE-01 servicio: GET usa la base compartida, sin cuerpo y con señal", async () => {
  const controller = new AbortController();
  const dto = progreso();
  vi.mocked(fetch).mockResolvedValueOnce(json(dto));
  await expect(metasApi.progreso(juegoId, controller.signal)).resolves.toEqual(
    dto,
  );
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledWith(
    `http://api.example.test/api/videojuegos/${juegoId}/progreso`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    },
  );
});

test.each([
  [
    "HTTPS con barra final",
    "https://api.example.test/api/",
    false,
    "https://api.example.test/api",
  ],
  ["proxy de desarrollo", undefined, true, "/api"],
] as const)(
  "FE-01 servicio: resuelve %s sin duplicar /api",
  async (_nombre, valor, desarrollo, esperado) => {
    const real = baseUrl.resolverBaseApi;
    vi.spyOn(baseUrl, "resolverBaseApi").mockImplementation(() =>
      real(valor, desarrollo),
    );
    vi.mocked(fetch).mockResolvedValueOnce(json(progreso()));
    await metasApi.progreso(juegoId);
    expect(fetch).toHaveBeenCalledWith(
      `${esperado}/videojuegos/${juegoId}/progreso`,
      expect.any(Object),
    );
  },
);

test.each([
  [undefined, false],
  ["https://api.example.test", false],
  ["https://api.example.test/api/api", true],
] as const)(
  "FE-01 servicio: configuración inválida %s se rechaza antes de la red",
  async (valor, desarrollo) => {
    const real = baseUrl.resolverBaseApi;
    vi.spyOn(baseUrl, "resolverBaseApi").mockImplementation(() =>
      real(valor, desarrollo),
    );
    await expect(metasApi.progreso(juegoId)).rejects.toMatchObject({
      name: "ErrorApi",
      status: undefined,
      message: expect.stringContaining("VITE_API_URL"),
    });
    expect(fetch).not.toHaveBeenCalled();
  },
);

test("FE-01 servicio: un ID se codifica como segmento sin añadir consultas", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    json({ error: "Id mal formado" }, 400),
  );
  await expect(metasApi.progreso("id/?otro=1")).rejects.toMatchObject({
    status: 400,
  });
  expect(fetch).toHaveBeenCalledWith(
    "http://api.example.test/api/videojuegos/id%2F%3Fotro%3D1/progreso",
    expect.any(Object),
  );
});

test("FE-01 servicio: conserva actividad sin meta, null y lista de hitos vacía", async () => {
  const dto = {
    ...progreso(),
    meta: null,
    porcentajeHoras: null,
    metaCumplida: null,
    hitos: [],
  };
  vi.mocked(fetch).mockResolvedValueOnce(json(dto));
  await expect(metasApi.progreso(juegoId)).resolves.toEqual(dto);
});

test.each([false, true])(
  "FE-01 servicio: sin partidas, meta activa=%s, conserva ceros reales",
  async (conMeta) => {
    const dto = {
      ...progreso(),
      minutosSemana: 0,
      horasSemana: 0,
      diasJugados: 0,
      porcentajeAvanceActual: 0,
      meta: conMeta ? meta : null,
      porcentajeHoras: conMeta ? 0 : null,
      metaCumplida: conMeta ? false : null,
      hitos: conMeta ? [{ ...meta.hitos[0], alcanzado: false }] : [],
    };
    vi.mocked(fetch).mockResolvedValueOnce(json(dto));
    await expect(metasApi.progreso(juegoId)).resolves.toEqual(dto);
  },
);

test("FE-01 servicio: no recalcula ni redondea valores del servidor", async () => {
  const dto = {
    ...progreso(),
    horasSemana: 1 / 60,
    porcentajeHoras: 99.9999,
    metaCumplida: false,
  };
  vi.mocked(fetch).mockResolvedValueOnce(json(dto));
  await expect(metasApi.progreso(juegoId)).resolves.toEqual(dto);
});

test.each([400, 404, 409])(
  "FE-01 servicio: HTTP %s conserva mensaje, requestId y detalles permitidos",
  async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      json(
        {
          error: "No se pudo consultar la meta",
          requestId: "peticion-sintetica",
          detalles: [
            {
              campo: "videojuego",
              mensaje: "Revisa el videojuego",
              valor: "dato-descartable",
            },
          ],
          stack: "traza-descartable",
          consulta: "dato-descartable",
        },
        status,
      ),
    );
    const error = await metasApi.progreso(juegoId).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({
      status,
      message: "No se pudo consultar la meta",
      requestId: "peticion-sintetica",
      detalles: [{ campo: "videojuego", mensaje: "Revisa el videojuego" }],
    });
    expect(error).not.toHaveProperty("consulta");
    expect(JSON.stringify(error)).not.toContain("dato-descartable");
    expect(JSON.stringify(error)).not.toContain("traza-descartable");
    expect(fetch).toHaveBeenCalledOnce();
  },
);

test("FE-01 servicio: error 500 usa mensaje genérico y requestId de cabecera", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    json(
      {
        error: "Detalle interno descartable",
        detalles: [{ campo: "db", mensaje: "Detalle interno" }],
      },
      500,
      { "x-request-id": "cabecera-sintetica" },
    ),
  );
  const error = await metasApi.progreso(juegoId).catch((e: unknown) => e);
  expect(error).toMatchObject({ status: 500, requestId: "cabecera-sintetica" });
  expect((error as Error).message).not.toContain("Detalle interno");
  expect(error).toHaveProperty("detalles", undefined);
});

test.each([
  "<html>Error del proxy</html>",
  "null",
  '"error"',
  "[]",
  '{"detalles":[null,{}]}',
])(
  "FE-01 servicio: error HTTP sin objeto JSON válido mantiene status: %s",
  async (body) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(body, {
        status: 404,
        headers: { "x-request-id": "cabecera-sintetica" },
      }),
    );
    await expect(metasApi.progreso(juegoId)).rejects.toMatchObject({
      name: "ErrorApi",
      status: 404,
      requestId: "cabecera-sintetica",
    });
  },
);

test("FE-01 servicio: fallo de red tipado sin inventar status ni filtrar el error nativo", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(
    new TypeError("Detalle nativo descartable"),
  );
  const error = await metasApi.progreso(juegoId).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ErrorApi);
  expect(error).toMatchObject({ status: undefined, requestId: undefined });
  expect((error as Error).message).not.toContain("Detalle nativo");
  expect(fetch).toHaveBeenCalledOnce();
});

test("FE-01 servicio: cancelación de fetch conserva AbortError", async () => {
  const cancelacion = new DOMException("Consulta cancelada", "AbortError");
  vi.mocked(fetch).mockRejectedValueOnce(cancelacion);
  await expect(metasApi.progreso(juegoId)).rejects.toBe(cancelacion);
});

test("FE-01 servicio: una señal ya cancelada no inicia fetch", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(metasApi.progreso(juegoId, controller.signal)).rejects.toBe(
    controller.signal.reason,
  );
  expect(fetch).not.toHaveBeenCalled();
});

test("FE-01 servicio: cancelación durante lectura JSON descarta respuesta tardía", async () => {
  const controller = new AbortController();
  const response = json(progreso());
  vi.spyOn(response, "json").mockImplementation(async () => {
    controller.abort();
    return progreso();
  });
  vi.mocked(fetch).mockResolvedValueOnce(response);
  const resultado = await metasApi
    .progreso(juegoId, controller.signal)
    .catch((error: unknown) => error);
  expect(controller.signal.aborted).toBe(true);
  expect(resultado).toBe(controller.signal.reason);
});

test("FE-01 servicio: éxito no JSON y 204 inesperado no son progreso vacío", async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(new Response("HTML inesperado", { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(metasApi.progreso(juegoId)).rejects.toMatchObject({
    name: "ErrorApi",
    status: 200,
  });
  await expect(metasApi.progreso(juegoId)).rejects.toMatchObject({
    name: "ErrorApi",
    status: 204,
  });
});

test.each([
  ["objeto vacío", {}],
  ["array", []],
  ["null", null],
  [
    "juego diferente",
    { ...progreso(), videojuego: "3123456789abcdef01234567" },
  ],
  ["zona incorrecta", { ...progreso(), zonaHoraria: "UTC" }],
  ["fecha ausente", { ...progreso(), fechaLocalActual: undefined }],
  ["semana ausente", { ...progreso(), semana: null }],
  ["número como texto", { ...progreso(), horasSemana: "7" }],
  ["días no enteros", { ...progreso(), diasJugados: 1.5 }],
  ["avance ausente", { ...progreso(), porcentajeAvanceActual: undefined }],
  ["cumplimiento textual", { ...progreso(), metaCumplida: "false" }],
  [
    "meta ajena",
    {
      ...progreso(),
      meta: { ...meta, videojuego: "3123456789abcdef01234567" },
    },
  ],
  [
    "meta incompleta",
    { ...progreso(), meta: { ...meta, createdAt: undefined } },
  ],
  ["meta inactiva", { ...progreso(), meta: { ...meta, activa: false } }],
  [
    "hito sin booleano",
    { ...progreso(), hitos: [{ ...meta.hitos[0], alcanzado: undefined }] },
  ],
  [
    "porcentaje sin meta",
    {
      ...progreso(),
      meta: null,
      porcentajeHoras: 0,
      metaCumplida: null,
      hitos: [],
    },
  ],
] as const)(
  "FE-01 servicio: DTO incompatible no se acepta: %s",
  async (_nombre, body) => {
    vi.mocked(fetch).mockResolvedValueOnce(json(body));
    await expect(metasApi.progreso(juegoId)).rejects.toMatchObject({
      name: "ErrorApi",
      status: 200,
    });
  },
);

test("FE-01 tipos: ausencia de meta y cumplimiento siguen siendo explícitamente null", () => {
  expectTypeOf<ProgresoJuegoDTO["meta"]>().toEqualTypeOf<MetaDTO | null>();
  expectTypeOf<ProgresoJuegoDTO["porcentajeHoras"]>().toEqualTypeOf<
    number | null
  >();
  expectTypeOf<ProgresoJuegoDTO["metaCumplida"]>().toEqualTypeOf<
    boolean | null
  >();
});
