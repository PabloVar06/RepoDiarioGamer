import { expect, test, vi } from "vitest";
import { metasApi } from "./metasApi";
import { metaE2 } from "../../tests/fixtures/e2";
test("FE-04 servicio: PUT conserva IDs de hitos y omisión de la lista", async () => {
  const datos = { minutosObjetivo: 300, diasPorSemana: 3 };
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(metaE2)));
  await expect(metasApi.actualizar(metaE2._id, datos)).resolves.toEqual(metaE2);
  expect(fetch).toHaveBeenCalledWith(
    `http://api.example.test/api/metas/${metaE2._id}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: undefined,
      body: JSON.stringify(datos),
    },
  );
});
test.each([400, 404, 409, 500])(
  "FE-04 servicio: conserva error HTTP %s sin reintento",
  async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Rechazo", requestId: "prueba" }), {
        status,
      }),
    );
    await expect(
      metasApi.actualizar(metaE2._id, {
        minutosObjetivo: 300,
        diasPorSemana: 3,
      }),
    ).rejects.toMatchObject({ status, requestId: "prueba" });
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
