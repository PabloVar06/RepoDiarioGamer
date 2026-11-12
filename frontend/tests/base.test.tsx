import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { videojuegosApi } from "../src/api/videojuegosApi";
import type { Videojuego } from "../src/tipos";

vi.mock("../src/api/videojuegosApi", () => ({
  videojuegosApi: { listar: vi.fn() },
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

function renderApp() {
  return render(<App />, { container: document.getElementById("root")! });
}

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.mocked(videojuegosApi.listar).mockImplementation(async (filtro = "") =>
    juegos.filter((juego) =>
      juego.nombre.toLowerCase().includes(filtro.toLowerCase()),
    ),
  );
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
