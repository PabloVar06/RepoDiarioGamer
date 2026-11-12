import { expect, test, vi } from "vitest";
import { ErrorApi, metasApi } from "./metasApi";
import { juegoE2, metaE2 } from "../../tests/fixtures/e2";

const consultas = [
  {
    nombre: "obtener",
    consultar: (signal?: AbortSignal) => metasApi.obtener(metaE2._id, signal),
    ruta: `/metas/${metaE2._id}`,
    cuerpo: metaE2,
  },
  {
    nombre: "activa",
    consultar: (signal?: AbortSignal) => metasApi.activa(juegoE2._id, signal),
    ruta: `/videojuegos/${juegoE2._id}/meta`,
    cuerpo: { meta: metaE2 },
  },
];

for (const { nombre, consultar, ruta, cuerpo } of consultas) {
  test(`FE-01 ${nombre}: GET canónico sin cuerpo, prefijo único y señal`, async () => {
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(cuerpo)),
    );
    await expect(consultar(controller.signal)).resolves.toEqual(cuerpo);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      `http://api.example.test/api${ruta}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
  });
  test.each([400, 404, 500])(
    `FE-01 ${nombre}: conserva HTTP %s/requestId sin reintentar`,
    async (status) => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "Recurso no disponible",
            requestId: "consulta-sintetica",
          }),
          { status },
        ),
      );
      await expect(consultar()).rejects.toMatchObject({
        name: "ErrorApi",
        status,
        requestId: "consulta-sintetica",
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
  test(`FE-01 ${nombre}: red y formato ilegible no se convierten en ausencia`, async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Fallo sintético"));
    await expect(consultar()).rejects.toBeInstanceOf(ErrorApi);
    vi.mocked(fetch).mockResolvedValueOnce(new Response("<html>error</html>"));
    await expect(consultar()).rejects.toMatchObject({ status: 200 });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(consultar()).rejects.toMatchObject({ status: 204 });
  });
  test(`FE-01 ${nombre}: aborto previo impide fetch y aborto durante lectura se conserva`, async () => {
    const cancelled = new AbortController();
    cancelled.abort();
    await expect(consultar(cancelled.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetch).not.toHaveBeenCalled();
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => {
        controller.abort();
        return cuerpo;
      },
    } as Response);
    await expect(consultar(controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
}

test("FE-01 obtener: admite históricas inactivas y rechaza ID diferente", async () => {
  const historica = { ...metaE2, activa: false };
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify(historica)),
  );
  await expect(metasApi.obtener(metaE2._id)).resolves.toEqual(historica);
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ ...metaE2, _id: juegoE2._id })),
  );
  await expect(metasApi.obtener(metaE2._id)).rejects.toMatchObject({
    status: 200,
  });
});
test("FE-01 activa: meta null explícita es ausencia válida", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('{"meta":null}'));
  await expect(metasApi.activa(juegoE2._id)).resolves.toEqual({ meta: null });
});
test.each([
  {},
  null,
  { meta: false },
  { meta: { ...metaE2, activa: false } },
  { meta: { ...metaE2, videojuego: metaE2._id } },
  { meta: { ...metaE2, minutosObjetivo: 0 } },
])(
  "FE-01 activa: rechaza DTO inválido o meta ajena/inactiva (%j)",
  async (cuerpo) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(cuerpo)),
    );
    await expect(metasApi.activa(juegoE2._id)).rejects.toMatchObject({
      status: 200,
    });
  },
);
test("FE-01 consultas: codifican el ID como segmento sin crear parámetros", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response('{"error":"Id mal formado"}', { status: 400 }),
  );
  await expect(metasApi.obtener("a/b?c")).rejects.toMatchObject({
    status: 400,
  });
  expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
    "http://api.example.test/api/metas/a%2Fb%3Fc",
  );
  vi.mocked(fetch).mockResolvedValue(
    new Response('{"error":"Id mal formado"}', { status: 400 }),
  );
  await expect(metasApi.activa("a/b?c")).rejects.toMatchObject({ status: 400 });
  expect(vi.mocked(fetch).mock.calls[1][0]).toBe(
    "http://api.example.test/api/videojuegos/a%2Fb%3Fc/meta",
  );
});
