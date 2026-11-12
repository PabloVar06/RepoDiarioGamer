import { expect, test, vi } from "vitest";
import { ErrorApi, metasApi } from "./metasApi";

const dto = {
  ambito: "global",
  zonaHoraria: "America/Guayaquil",
  fechaLocalActual: "2026-11-15",
  rachaActual: 0,
  mejorRacha: 5,
};
test("FE-02 servicio: GET global sin filtros/cuerpo, señal y ceros", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(dto)));
  const signal = new AbortController().signal;
  await expect(metasApi.rachas(signal)).resolves.toEqual(dto);
  expect(fetch).toHaveBeenCalledWith("http://api.example.test/api/rachas", {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
});
test.each([
  { rachaActual: -1 },
  { rachaActual: 1.5 },
  { mejorRacha: 0, rachaActual: 2 },
  { ambito: "videojuego" },
  { zonaHoraria: "UTC" },
  { mejorRacha: null },
])("FE-02 servicio: rechaza DTO inválido %j", async (cambios) => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ ...dto, ...cambios })),
  );
  await expect(metasApi.rachas()).rejects.toBeInstanceOf(ErrorApi);
});
test.each([400, 404, 500])(
  "FE-02 servicio: HTTP %s conserva status e identificador",
  async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Rechazo sintético", requestId: "prueba" }),
        { status },
      ),
    );
    await expect(metasApi.rachas()).rejects.toMatchObject({
      status,
      requestId: "prueba",
    });
  },
);
test("FE-02 servicio: fallo no JSON y aborto no se presentan como rachas cero", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response("<html>Error</html>", { status: 500 }),
  );
  await expect(metasApi.rachas()).rejects.toMatchObject({ status: 500 });
  const controlador = new AbortController();
  controlador.abort();
  await expect(metasApi.rachas(controlador.signal)).rejects.toMatchObject({
    name: "AbortError",
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
