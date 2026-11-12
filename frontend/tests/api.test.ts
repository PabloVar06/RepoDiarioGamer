import { expect, test, vi } from "vitest";
import { videojuegosApi } from "../src/api/videojuegosApi";
import { partidasApi } from "../src/api/partidasApi";
import * as baseUrl from "../src/api/baseUrl";

const resolverReal = baseUrl.resolverBaseApi;

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

test.each([
  ["videojuegos", () => videojuegosApi.listar(), "/videojuegos"],
  ["partidas", () => partidasApi.listar(), "/partidas"],
] as const)(
  "HAB-05: %s utiliza la base normalizada sin duplicar /api",
  async (_name, call, path) => {
    const resolve = vi
      .spyOn(baseUrl, "resolverBaseApi")
      .mockImplementation(() =>
        resolverReal("https://api.example.test/api/", false),
      );
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    await expect(call()).resolves.toEqual([]);
    expect(resolve).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      `https://api.example.test/api${path}`,
      expect.any(Object),
    );
  },
);

test.each([
  ["videojuegos", () => videojuegosApi.listar(), "/videojuegos"],
  ["partidas", () => partidasApi.listar(), "/partidas"],
] as const)(
  "HAB-05: %s usa el proxy /api cuando falta configuración en desarrollo",
  async (_name, call, path) => {
    vi.spyOn(baseUrl, "resolverBaseApi").mockImplementation(() =>
      resolverReal(undefined, true),
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    await expect(call()).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith(`/api${path}`, expect.any(Object));
  },
);

test.each([
  ["videojuegos", () => videojuegosApi.listar()],
  ["partidas", () => partidasApi.listar()],
] as const)(
  "HAB-05: %s rechaza configuración de producción ausente antes de fetch",
  async (_name, call) => {
    vi.spyOn(baseUrl, "resolverBaseApi").mockImplementation(() =>
      resolverReal(undefined, false),
    );
    let result: ReturnType<typeof call> | undefined;
    expect(() => {
      result = call();
    }).not.toThrow();
    await expect(result).rejects.toThrow(/VITE_API_URL/);
    expect(fetch).not.toHaveBeenCalled();
  },
);

test.each([
  ["videojuegos", () => videojuegosApi.listar()],
  ["partidas", () => partidasApi.listar()],
] as const)(
  "HAB-05: %s rechaza prefijo ausente antes de fetch",
  async (_name, call) => {
    vi.spyOn(baseUrl, "resolverBaseApi").mockImplementation(() =>
      resolverReal("https://api.example.test", false),
    );
    await expect(call()).rejects.toThrow(/VITE_API_URL/);
    expect(fetch).not.toHaveBeenCalled();
  },
);

test("E1: crear partida conserva ruta, cabeceras y cuerpo", async () => {
  const data = {
    videojuego: "juego-sintetico",
    fecha: "2026-11-09",
    duracionMinutos: 60,
    porcentajeAvance: 25,
  };
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ ...data, _id: "partida-sintetica" }), {
      status: 201,
    }),
  );
  await expect(partidasApi.crear(data)).resolves.toEqual({
    ...data,
    _id: "partida-sintetica",
  });
  expect(fetch).toHaveBeenCalledWith("http://api.example.test/api/partidas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
});

test("E1: el cliente de partidas conserva el mensaje HTTP y el fallback cuando no hay JSON", async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Partida no encontrada" }), {
        status: 404,
      }),
    )
    .mockResolvedValueOnce(new Response("Respuesta no JSON", { status: 500 }));
  await expect(partidasApi.eliminar("id-de-prueba")).rejects.toThrow(
    "Partida no encontrada",
  );
  await expect(partidasApi.listar()).rejects.toThrow("Error HTTP 500");
});

test("E1: eliminar partida con 204 no intenta leer JSON", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(partidasApi.eliminar("id-de-prueba")).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledWith(
    "http://api.example.test/api/partidas/id-de-prueba",
    expect.objectContaining({ method: "DELETE" }),
  );
});
