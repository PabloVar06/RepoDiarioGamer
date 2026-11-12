import { expect, test, vi } from "vitest";
import { metasApi } from "./metasApi";
import { metaE2 } from "../../tests/fixtures/e2";
test("FE-05 servicio: DELETE 204 no parsea JSON ni envía cuerpo", async () => {
  const response = new Response(null, { status: 204 });
  const parsear = vi.spyOn(response, "json");
  vi.mocked(fetch).mockResolvedValueOnce(response);
  await expect(metasApi.desactivar(metaE2._id)).resolves.toBeUndefined();
  expect(parsear).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledWith(
    `http://api.example.test/api/metas/${metaE2._id}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      signal: undefined,
    },
  );
});
test.each([400, 404, 500])(
  "FE-05 servicio: HTTP %s conserva status y no repite DELETE",
  async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Error", requestId: "prueba" }), {
        status,
      }),
    );
    await expect(metasApi.desactivar(metaE2._id)).rejects.toMatchObject({
      status,
      requestId: "prueba",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
