import { expect, test, vi } from "vitest";
import { videojuegosApi } from "../src/api/videojuegosApi";

test("E1: el cliente HTTP utiliza la base sintética del runner", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  await expect(videojuegosApi.listar("Zelda & Hades")).resolves.toEqual([]);
  expect(fetch).toHaveBeenCalledWith(
    "http://api.example.test/api/videojuegos?filtro=Zelda%20%26%20Hades",
    expect.objectContaining({
      headers: { "Content-Type": "application/json" },
    }),
  );
});

test("E1: el cliente conserva el mensaje de error HTTP", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Videojuego no encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }),
  );
  await expect(videojuegosApi.obtener("id-de-prueba")).rejects.toThrow(
    "Videojuego no encontrado",
  );
});

test("E1: eliminar con 204 no intenta leer JSON", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(
    videojuegosApi.eliminar("id-de-prueba"),
  ).resolves.toBeUndefined();
});
