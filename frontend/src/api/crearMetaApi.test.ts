import { expect, test, vi } from "vitest";
import { ErrorApi, metasApi } from "./metasApi";
import { juegoE2, metaE2 } from "../../tests/fixtures/e2";
import type { CrearMeta } from "../tipos";

const datos: CrearMeta = {
  videojuego: juegoE2._id,
  minutosObjetivo: 300,
  diasPorSemana: 3,
};
test("FE-03 servicio: POST canónico devuelve MetaDTO 201 sin campos protegidos", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify(metaE2), { status: 201 }),
  );
  await expect(metasApi.crear(datos)).resolves.toEqual(metaE2);
  expect(fetch).toHaveBeenCalledWith("http://api.example.test/api/metas", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    signal: undefined,
    body: JSON.stringify(datos),
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
test.each([200, 204])(
  "FE-03 servicio: éxito %s inesperado no se acepta como creación",
  async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(status === 204 ? null : JSON.stringify(metaE2), { status }),
    );
    await expect(metasApi.crear(datos)).rejects.toBeInstanceOf(ErrorApi);
  },
);
test.each([
  { videojuego: "3123456789abcdef01234567" },
  { activa: false },
  { minutosObjetivo: 0 },
])("FE-03 servicio: rechaza MetaDTO inconsistente %j", async (cambios) => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ ...metaE2, ...cambios }), { status: 201 }),
  );
  await expect(metasApi.crear(datos)).rejects.toMatchObject({ status: 201 });
});
test("FE-03 servicio: 400 conserva detalles/requestId y 409 no reintenta POST", async () => {
  const detalles = [{ campo: "diasPorSemana", mensaje: "Días inválidos" }];
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(
      JSON.stringify({ error: "Revisa días", requestId: "prueba", detalles }),
      { status: 400 },
    ),
  );
  await expect(metasApi.crear(datos)).rejects.toMatchObject({
    status: 400,
    requestId: "prueba",
    detalles,
  });
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Ya existe una meta" }), {
      status: 409,
    }),
  );
  await expect(metasApi.crear(datos)).rejects.toMatchObject({ status: 409 });
  expect(fetch).toHaveBeenCalledTimes(2);
});
test("FE-03 servicio: red o 500 no JSON no repiten escrituras ni filtran HTML", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Fallo sintético"));
  await expect(metasApi.crear(datos)).rejects.toMatchObject({
    status: undefined,
  });
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response("<html>dato interno</html>", { status: 500 }),
  );
  await expect(metasApi.crear(datos)).rejects.toMatchObject({
    status: 500,
    message: "No pudimos guardar la meta. Inténtalo de nuevo.",
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
