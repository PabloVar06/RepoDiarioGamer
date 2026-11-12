import { beforeEach, expect, test, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { juegoE2, pendiente, progresoE2, rachasE2 } from "./fixtures/e2";
import type { Partida, Videojuego } from "../src/tipos";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
const juego: Videojuego = {
  ...juegoE2,
  genero: "Terror",
  estado: "Abandonado",
  logros: [
    { _id: "2123456789abcdef01234567", nombre: "Inicio", obtenido: true },
  ],
};
let catalogo: Videojuego[];
let historial: Partida[] | Promise<Partida[]> | Error;
let rechazoGuardado: boolean;
let envios: { method: string; datos: Record<string, unknown> }[];
function montar(path: string) {
  window.history.replaceState({}, "", path);
  return render(<App />, { container: document.getElementById("root")! });
}
beforeEach(() => {
  catalogo = [juego];
  historial = [];
  rechazoGuardado = false;
  envios = [];
  vi.mocked(fetch).mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname;
    const method = options?.method ?? "GET";
    if (
      (method === "POST" || method === "PUT") &&
      path.startsWith("/api/videojuegos")
    ) {
      const datos = JSON.parse(String(options?.body));
      envios.push({ method, datos });
      if (rechazoGuardado)
        return new Response(JSON.stringify({ error: "Nombre rechazado" }), {
          status: 400,
        });
      return new Response(JSON.stringify({ ...juego, ...datos }), {
        status: method === "POST" ? 201 : 200,
      });
    }
    if (path === "/api/videojuegos")
      return new Response(JSON.stringify(catalogo));
    if (path === `/api/videojuegos/${juego._id}`)
      return new Response(JSON.stringify(juego));
    if (path === "/api/partidas") {
      if (historial instanceof Error)
        return new Response(JSON.stringify({ error: historial.message }), {
          status: 500,
        });
      return new Response(JSON.stringify(await historial));
    }
    if (path.endsWith("/partidas")) return new Response("[]");
    if (path.endsWith("/resumen"))
      return new Response(
        JSON.stringify({
          totalPartidas: 0,
          horasTotales: 0,
          ultimaPartida: null,
          porcentajeAvanceActual: 0,
        }),
      );
    if (path.endsWith("/progreso"))
      return new Response(JSON.stringify(progresoE2()));
    if (path === "/api/rachas") return new Response(JSON.stringify(rachasE2()));
    throw new Error(`Ruta no simulada ${method} ${path}`);
  });
});
test.each([
  ["/videojuegos/nuevo", "Añadir videojuego"],
  [`/videojuegos/${juego._id}/editar`, "Editar videojuego"],
  ["/partidas/nueva", "Registrar partida"],
  ["/partidas", "Mis partidas"],
])(
  "VIS-02: %s presenta controles etiquetados sin estilos legacy ni hexadecimales",
  async (path, titulo) => {
    montar(path);
    await screen.findByRole("heading", { name: titulo });
    if (path !== "/partidas")
      await screen.findByLabelText(
        path === "/partidas/nueva" ? "Fecha de inicio" : "Nombre",
      );
    if (path.includes("editar"))
      await waitFor(() =>
        expect(screen.getByLabelText("Nombre")).toHaveValue(juego.nombre),
      );
    const main = screen.getByRole("main");
    expect(main.innerHTML).not.toMatch(
      /gamer-|shadow-|text-white|bg-white|text-\[11px\]|#[a-f\d]{6}/i,
    );
    for (const control of main.querySelectorAll("input,select,textarea"))
      expect(control).toHaveAccessibleName();
  },
);
test("VIS-02: crear videojuego conserva campos, enums y formato de logros E1", async () => {
  const user = userEvent.setup();
  montar("/videojuegos/nuevo");
  await user.type(screen.getByLabelText("Nombre"), "Juego nuevo");
  await user.selectOptions(screen.getByLabelText("Género"), "Terror");
  await user.selectOptions(screen.getByLabelText("Estado"), "Abandonado");
  await user.type(
    screen.getByLabelText(/Logros iniciales/),
    "Primero|Descripción",
  );
  await user.click(screen.getByRole("button", { name: "Crear videojuego" }));
  await waitFor(() => expect(envios).toHaveLength(1));
  expect(envios[0]).toEqual({
    method: "POST",
    datos: {
      nombre: "Juego nuevo",
      plataforma: "PC",
      genero: "Terror",
      estado: "Abandonado",
      logros: [
        { nombre: "Primero", descripcion: "Descripción", obtenido: false },
      ],
    },
  });
  await waitFor(() =>
    expect(window.location.pathname).toBe(`/videojuegos/${juego._id}`),
  );
});
test("VIS-02: editar precarga datos y conserva obtenido del logro sin cambiar contrato", async () => {
  const user = userEvent.setup();
  montar(`/videojuegos/${juego._id}/editar`);
  await waitFor(() =>
    expect(screen.getByLabelText("Nombre")).toHaveValue(juego.nombre),
  );
  expect(screen.getByLabelText("Estado")).toHaveValue("Abandonado");
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Renombrado" },
  });
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(envios).toHaveLength(1));
  expect(envios[0].method).toBe("PUT");
  expect(envios[0].datos.logros).toEqual([
    { nombre: "Inicio", descripcion: "", obtenido: true },
  ]);
});
test("VIS-02: rechazo de guardado anuncia error accesible y conserva controles/valores", async () => {
  rechazoGuardado = true;
  const user = userEvent.setup();
  montar("/videojuegos/nuevo");
  const nombre = screen.getByLabelText("Nombre");
  await user.type(nombre, "Conservar borrador");
  await user.click(screen.getByRole("button", { name: "Crear videojuego" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Nombre rechazado",
  );
  expect(screen.getByLabelText("Nombre")).toBe(nombre);
  expect(nombre).toHaveValue("Conservar borrador");
  expect(envios).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
    "href",
    "/",
  );
});
test("VIS-02: historial anuncia carga sin vacío, luego conserva fecha, nombre y acciones", async () => {
  const deferred = pendiente<Partida[]>();
  historial = deferred.promesa;
  montar("/partidas");
  expect(await screen.findByRole("status")).toHaveTextContent("Cargando datos");
  expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
  await act(async () =>
    deferred.resolver([
      {
        _id: "3123456789abcdef01234567",
        videojuego: juego,
        fecha: "2026-11-15T00:00:00.000Z",
        duracionMinutos: 60,
        porcentajeAvance: 20,
        notas: "Sesión visible",
      },
    ]),
  );
  expect(await screen.findByText(/Sesión visible/)).toHaveTextContent(
    "15/11/2026",
  );
  expect(screen.getByRole("link", { name: juego.nombre })).toHaveAttribute(
    "href",
    `/videojuegos/${juego._id}`,
  );
  expect(
    screen.getByRole("button", { name: "Eliminar partida" }),
  ).toBeInTheDocument();
});
test("VIS-02: historial vacío orienta a registrar partida", async () => {
  montar("/partidas");
  await screen.findByText(/Todavía no hay datos/);
  const status = screen.getByRole("status");
  expect(
    within(status).getByRole("link", { name: "Registrar partida" }),
  ).toHaveAttribute("href", "/partidas/nueva");
});
test("VIS-02: historial recupera error con reintento de lectura, sin mutación", async () => {
  historial = new Error("Historial no disponible");
  const user = userEvent.setup();
  montar("/partidas");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Historial no disponible",
  );
  historial = [];
  await user.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText(/Todavía no hay datos/)).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(envios).toHaveLength(0);
});
test("VIS-02: catálogo vacío del registro ofrece añadir videojuego sin enviar", async () => {
  catalogo = [];
  montar("/partidas/nueva");
  expect(await screen.findByText(/Todavía no hay datos/)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Añadir videojuego" }),
  ).toHaveAttribute("href", "/videojuegos/nuevo");
  expect(
    screen.queryByRole("button", { name: "Guardar partida" }),
  ).not.toBeInTheDocument();
});
