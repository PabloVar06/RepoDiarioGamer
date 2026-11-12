import { beforeEach, expect, test, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { videojuegosApi } from "../src/api/videojuegosApi";
import { partidasApi } from "../src/api/partidasApi";
import type { Partida, Videojuego } from "../src/tipos";

vi.mock("../src/api/videojuegosApi", () => ({
  videojuegosApi: { listar: vi.fn() },
}));
vi.mock("../src/api/partidasApi", () => ({
  partidasApi: { listar: vi.fn() },
}));
vi.mock("gsap", () => ({
  default: { fromTo: vi.fn(), to: vi.fn() },
}));

const juegos: Videojuego[] = [
  {
    _id: "000000000000000000000001",
    nombre: "Zelda",
    plataforma: "Switch",
    genero: "Accion",
    estado: "Jugando",
    logros: [],
  },
  {
    _id: "000000000000000000000002",
    nombre: "Hades",
    plataforma: "PC",
    genero: "Rol",
    estado: "Completado",
    logros: [],
  },
];

function renderApp(path = "/") {
  window.history.replaceState({}, "", path);
  return render(<App />, { container: document.getElementById("root")! });
}

function pendingResponse<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(videojuegosApi.listar)
    .mockReset()
    .mockImplementation(async (filtro = "") =>
      juegos.filter((juego) =>
        juego.nombre.toLowerCase().includes(filtro.toLowerCase()),
      ),
    );
  vi.mocked(partidasApi.listar).mockReset().mockResolvedValue([]);
});

test("E1: muestra la biblioteca con los datos simulados", async () => {
  renderApp();
  expect(
    await screen.findByRole("heading", { name: "Zelda" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Hades" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /Ver progreso/ })).toHaveLength(2);
});

test("E1: filtrar por nombre actualiza los juegos visibles", async () => {
  const user = userEvent.setup();
  renderApp();
  await screen.findByRole("heading", { name: "Zelda" });
  await user.type(
    screen.getByRole("textbox", { name: "Filtrar videojuegos" }),
    "Hades",
  );
  await waitFor(() => {
    expect(videojuegosApi.listar).toHaveBeenLastCalledWith("Hades");
    expect(
      screen.queryByRole("heading", { name: "Zelda" }),
    ).not.toBeInTheDocument();
  });
  expect(screen.getByRole("heading", { name: "Hades" })).toBeInTheDocument();
});

test("E1: un error de carga se informa sin inventar una biblioteca vacía", async () => {
  vi.mocked(videojuegosApi.listar).mockRejectedValueOnce(
    new Error("No pudimos cargar los juegos de prueba"),
  );
  renderApp();
  expect(
    await screen.findByText("No pudimos cargar los juegos de prueba"),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
});

test("E1: biblioteca mantiene carga mientras la API está pendiente y muestra el resultado al resolver", async () => {
  const pending = pendingResponse<Videojuego[]>();
  vi.mocked(videojuegosApi.listar).mockReturnValueOnce(pending.promise);
  renderApp();
  await waitFor(() => expect(videojuegosApi.listar).toHaveBeenCalledWith(""));
  expect(screen.getByText("Cargando datos…")).toBeInTheDocument();
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Zelda" }),
  ).not.toBeInTheDocument();

  await act(async () => {
    pending.resolve(juegos);
    await pending.promise;
  });
  expect(
    await screen.findByRole("heading", { name: "Zelda" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Cargando datos…")).not.toBeInTheDocument();
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
});

test("E1: historial mantiene carga mientras la API está pendiente y muestra partidas al resolver", async () => {
  const pending = pendingResponse<Partida[]>();
  vi.mocked(partidasApi.listar).mockReturnValueOnce(pending.promise);
  renderApp("/partidas");
  await waitFor(() => expect(partidasApi.listar).toHaveBeenCalledTimes(1));
  expect(screen.getByText("Cargando datos…")).toBeInTheDocument();
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Sesión de prueba/)).not.toBeInTheDocument();

  await act(async () => {
    pending.resolve([
      {
        _id: "000000000000000000000003",
        videojuego: juegos[0],
        fecha: "2026-11-09T00:00:00.000Z",
        duracionMinutos: 60,
        porcentajeAvance: 25,
        notas: "Sesión de prueba",
      },
    ]);
    await pending.promise;
  });
  expect(await screen.findByText(/Sesión de prueba/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Zelda" })).toHaveAttribute(
    "href",
    `/videojuegos/${juegos[0]._id}`,
  );
  expect(screen.queryByText("Cargando datos…")).not.toBeInTheDocument();
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
});

test("E1: biblioteca realmente vacía se distingue de carga y error", async () => {
  vi.mocked(videojuegosApi.listar).mockResolvedValueOnce([]);
  renderApp();
  expect(
    await screen.findByText("Todavía no hay datos. ¡Añade el primero!"),
  ).toBeInTheDocument();
  expect(videojuegosApi.listar).toHaveBeenCalledWith("");
  expect(screen.queryByText("Cargando datos…")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Ver progreso/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("No pudimos cargar los juegos de prueba"),
  ).not.toBeInTheDocument();
});

test("E1: historial realmente vacío se distingue de carga y error", async () => {
  renderApp("/partidas");
  expect(
    await screen.findByText("Todavía no hay datos. ¡Añade el primero!"),
  ).toBeInTheDocument();
  expect(partidasApi.listar).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Cargando datos…")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Eliminar partida" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "+ Nueva partida" })).toHaveAttribute(
    "href",
    "/partidas/nueva",
  );
});

test("E1: cambiar el filtro recupera la biblioteca tras error de API sin remontar la interfaz", async () => {
  const pending = pendingResponse<Videojuego[]>();
  vi.mocked(videojuegosApi.listar)
    .mockRejectedValueOnce(new Error("No pudimos cargar los juegos de prueba"))
    .mockReturnValueOnce(pending.promise);
  const user = userEvent.setup();
  renderApp();
  expect(
    await screen.findByText("No pudimos cargar los juegos de prueba"),
  ).toBeInTheDocument();
  const filter = screen.getByRole("textbox", { name: "Filtrar videojuegos" });
  await user.type(filter, "Hades");
  await waitFor(() =>
    expect(videojuegosApi.listar).toHaveBeenLastCalledWith("Hades"),
  );
  expect(videojuegosApi.listar).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Cargando datos…")).toBeInTheDocument();
  expect(
    screen.queryByText("No pudimos cargar los juegos de prueba"),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();

  await act(async () => {
    pending.resolve([juegos[1]]);
    await pending.promise;
  });
  expect(
    await screen.findByRole("heading", { name: "Hades" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Filtrar videojuegos" })).toBe(
    filter,
  );
  expect(filter).toHaveValue("Hades");
  expect(
    screen.queryByRole("heading", { name: "Zelda" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Cargando datos…")).not.toBeInTheDocument();
  expect(
    screen.queryByText("No pudimos cargar los juegos de prueba"),
  ).not.toBeInTheDocument();
  expect(videojuegosApi.listar).toHaveBeenCalledTimes(2);
});
