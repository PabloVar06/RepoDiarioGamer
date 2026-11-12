import { beforeEach, expect, test, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import type { Videojuego } from "../src/tipos";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));

const juegos: Videojuego[] = [
  {
    _id: "0123456789abcdef01234567",
    nombre: "Zelda",
    plataforma: "Switch",
    genero: "Accion",
    estado: "Jugando",
    logros: [
      { _id: "1123456789abcdef01234567", nombre: "Inicio", obtenido: true },
      { _id: "2123456789abcdef01234567", nombre: "Final", obtenido: false },
    ],
  },
  {
    _id: "3123456789abcdef01234567",
    nombre: "Hades",
    plataforma: "PC",
    genero: "Rol",
    estado: "Completado",
    logros: [],
  },
];
let catalogo: Videojuego[] | Promise<Videojuego[]> | Error;
let solicitudes: { method: string; path: string }[];
let errorEliminar: boolean;

function renderApp(path = "/") {
  window.history.replaceState({}, "", path);
  return render(<App />, { container: document.getElementById("root")! });
}
function tarjeta(nombre: string) {
  return screen.getByRole("heading", { name: nombre }).closest("article")!;
}
beforeEach(() => {
  catalogo = [...juegos];
  solicitudes = [];
  errorEliminar = false;
  vi.mocked(fetch).mockImplementation(async (input, options) => {
    const url = new URL(String(input));
    const method = options?.method || "GET";
    solicitudes.push({ method, path: url.pathname + url.search });
    if (url.pathname === "/api/videojuegos" && method === "GET") {
      if (catalogo instanceof Error)
        return new Response(JSON.stringify({ error: catalogo.message }), {
          status: 500,
        });
      const filtro = (url.searchParams.get("filtro") || "").toLowerCase();
      const rows = (await catalogo).filter((j) =>
        j.nombre.toLowerCase().includes(filtro),
      );
      return new Response(JSON.stringify(rows));
    }
    if (url.pathname.startsWith("/api/videojuegos/") && method === "DELETE") {
      if (errorEliminar)
        return new Response(JSON.stringify({ error: "No se pudo eliminar" }), {
          status: 500,
        });
      catalogo = ((await catalogo) as Videojuego[]).filter(
        (j) => !url.pathname.endsWith(j._id),
      );
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/api/partidas" && method === "GET")
      return new Response("[]");
    throw new Error(`Ruta no simulada: ${method} ${url.pathname}`);
  });
});

test.each(["Navegación principal", "Navegación móvil"])(
  "%s identifica ruta activa y conserva acceso al historial",
  async (nombre) => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: "Zelda" });
    const nav = screen.getByRole("navigation", { name: nombre });
    expect(
      within(nav).getByRole("link", { name: "Videojuegos" }),
    ).toHaveAttribute("aria-current", "page");
    const partidas = within(nav).getByRole("link", { name: "Partidas" });
    await user.click(partidas);
    expect(
      await screen.findByRole("heading", { name: "Mis partidas" }),
    ).toBeInTheDocument();
    expect(partidas).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Videojuegos" }),
    ).not.toHaveAttribute("aria-current");
  },
);

test("búsqueda tiene etiqueta visible que enfoca el control y conserva filtro por nombre", async () => {
  const user = userEvent.setup();
  renderApp();
  await screen.findByRole("heading", { name: "Zelda" });
  const input = screen.getByRole("textbox", { name: "Filtrar videojuegos" });
  const label = screen.getByText("Filtrar videojuegos", { selector: "label" });
  await user.click(label);
  expect(input).toHaveFocus();
  await user.type(input, "Hades");
  await waitFor(() =>
    expect(
      screen.queryByRole("heading", { name: "Zelda" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("heading", { name: "Hades" })).toBeInTheDocument();
  expect(solicitudes[solicitudes.length - 1]?.path).toBe(
    "/api/videojuegos?filtro=Hades",
  );
});

test("tarjetas conservan metadatos, logros y rutas de progreso/edición y creación", async () => {
  renderApp();
  await screen.findByRole("heading", { name: "Zelda" });
  const card = within(tarjeta("Zelda"));
  expect(card.getByText(/Switch/)).toBeInTheDocument();
  expect(card.getByText(/Accion/)).toBeInTheDocument();
  expect(card.getByText("Jugando")).toBeInTheDocument();
  expect(card.getByText("1/2 logros")).toBeInTheDocument();
  expect(card.getByRole("link", { name: /Ver progreso/ })).toHaveAttribute(
    "href",
    `/videojuegos/${juegos[0]._id}`,
  );
  expect(card.getByRole("link", { name: "Editar" })).toHaveAttribute(
    "href",
    `/videojuegos/${juegos[0]._id}/editar`,
  );
  expect(
    screen
      .getAllByRole("link", { name: /Añadir juego/ })
      .every((l) => l.getAttribute("href") === "/videojuegos/nuevo"),
  ).toBe(true);
});

test("carga pendiente anuncia estado sin inventar vacío", async () => {
  let resolve!: (rows: Videojuego[]) => void;
  catalogo = new Promise<Videojuego[]>((complete) => {
    resolve = complete;
  });
  renderApp();
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Cargando datos…",
  );
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
  await act(async () => {
    resolve(juegos);
  });
  expect(
    await screen.findByRole("heading", { name: "Zelda" }),
  ).toBeInTheDocument();
});

test("vacío real mantiene explicación y enlace a creación", async () => {
  catalogo = [];
  renderApp();
  expect(
    await screen.findByText("Todavía no hay datos. ¡Añade el primero!"),
  ).toBeInTheDocument();
  const status = screen.getByRole("status");
  expect(
    within(status).getByRole("link", { name: "Añadir videojuego" }),
  ).toHaveAttribute("href", "/videojuegos/nuevo");
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
});

test("error ofrece reintento de lectura con el mismo filtro y control", async () => {
  const user = userEvent.setup();
  renderApp();
  await screen.findByRole("heading", { name: "Zelda" });
  const input = screen.getByRole("textbox", { name: "Filtrar videojuegos" });
  catalogo = new Error("No pudimos cargar la biblioteca");
  await user.type(input, "Hades");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No pudimos cargar la biblioteca",
  );
  catalogo = [...juegos];
  await user.click(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("textbox", { name: "Filtrar videojuegos" })).toBe(
    input,
  );
  expect(input).toHaveValue("Hades");
  expect(screen.getByRole("heading", { name: "Hades" })).toBeInTheDocument();
  expect(solicitudes[solicitudes.length - 1]).toEqual({
    method: "GET",
    path: "/api/videojuegos?filtro=Hades",
  });
});

test("eliminar conserva confirmación, cancelación, recarga y otros juegos", async () => {
  const user = userEvent.setup();
  const confirm = vi
    .spyOn(window, "confirm")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  renderApp();
  await screen.findByRole("heading", { name: "Zelda" });
  const eliminar = within(tarjeta("Zelda")).getByRole("button", {
    name: "Eliminar",
  });
  await user.click(eliminar);
  expect(solicitudes.filter((r) => r.method === "DELETE")).toEqual([]);
  expect(screen.getByRole("heading", { name: "Zelda" })).toBeInTheDocument();
  await user.click(eliminar);
  await waitFor(() =>
    expect(
      screen.queryByRole("heading", { name: "Zelda" }),
    ).not.toBeInTheDocument(),
  );
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(confirm).toHaveBeenCalledWith(
    "¿Eliminar este videojuego y sus partidas?",
  );
  expect(screen.getByRole("heading", { name: "Hades" })).toBeInTheDocument();
  expect(solicitudes.filter((r) => r.method === "DELETE")).toEqual([
    { method: "DELETE", path: `/api/videojuegos/${juegos[0]._id}` },
  ]);
});

test("fallo al eliminar conserva tarjetas y reintentar solo vuelve a consultar", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  errorEliminar = true;
  renderApp();
  await screen.findByRole("heading", { name: "Zelda" });
  await user.click(
    within(tarjeta("Zelda")).getByRole("button", { name: "Eliminar" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No se pudo eliminar",
  );
  expect(screen.getByRole("heading", { name: "Zelda" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
  );
  expect(solicitudes.filter((r) => r.method === "DELETE")).toHaveLength(1);
});
