import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import type { Partida, Videojuego } from "../src/tipos";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));

const juego: Videojuego = {
  _id: "0123456789abcdef01234567",
  nombre: "Juego civil",
  plataforma: "PC",
  genero: "Rol",
  estado: "Jugando",
  logros: [
    { _id: "1123456789abcdef01234567", nombre: "Manual", obtenido: true },
  ],
};
let partidas: Partida[];
let enviados: Record<string, unknown>[];

function registro(fecha = "2026-11-15T00:00:00.000Z"): Partida {
  return {
    _id: "2123456789abcdef01234567",
    videojuego: juego._id,
    fecha,
    duracionMinutos: 90,
    porcentajeAvance: 25,
    notas: "Sesión civil",
  };
}

function renderApp(path: string) {
  window.history.replaceState({}, "", path);
  return render(<App />, { container: document.getElementById("root")! });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-16T04:59:59.999Z"));
  partidas = [];
  enviados = [];
  // Se usan ambos clientes reales; únicamente se simula el transporte HTTP.
  vi.mocked(fetch).mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname;
    let body: unknown;
    if (options?.method === "POST" && path === "/api/partidas") {
      const payload = JSON.parse(String(options.body));
      enviados.push(payload);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.fecha)) {
        return new Response(JSON.stringify({ error: "Se exige fecha civil" }), {
          status: 400,
        });
      }
      const creada = {
        ...registro(`${payload.fecha}T00:00:00.000Z`),
        ...payload,
        fecha: `${payload.fecha}T00:00:00.000Z`,
      };
      partidas.push(creada);
      return new Response(JSON.stringify(creada), { status: 201 });
    }
    if (path === "/api/videojuegos") body = [juego];
    else if (path === `/api/videojuegos/${juego._id}`) body = juego;
    else if (path === `/api/videojuegos/${juego._id}/partidas`) body = partidas;
    else if (path === "/api/partidas")
      body = partidas.map((p) => ({ ...p, videojuego: juego }));
    else if (path === `/api/videojuegos/${juego._id}/resumen`)
      body = partidas.length
        ? {
            totalPartidas: 1,
            horasTotales: 1.5,
            ultimaPartida: partidas[0].fecha,
            porcentajeAvanceActual: 25,
          }
        : {
            totalPartidas: 0,
            horasTotales: 0,
            ultimaPartida: null,
            porcentajeAvanceActual: 0,
          };
    else throw new Error(`Ruta no simulada: ${path}`);
    return new Response(JSON.stringify(body));
  });
});

afterEach(() => vi.useRealTimers());

test("formulario usa solo día, hoy de Guayaquil y límites de calendario aprobados", async () => {
  renderApp(`/partidas/nueva?videojuego=${juego._id}`);
  const fecha = await screen.findByLabelText("Fecha de inicio");
  expect(fecha).toHaveAttribute("type", "date");
  expect(fecha).toHaveValue("2026-11-15");
  expect(fecha).toHaveAttribute("min", "0001-01-01");
  expect(fecha).toHaveAttribute("max", "2026-11-15");
  expect(fecha).toBeRequired();
  expect(screen.queryByLabelText("Fecha y hora")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Duración (minutos)")).toHaveValue(60);
});

test("guardar conserva el día en JSON, navegación, historial del juego y resumen", async () => {
  const user = userEvent.setup();
  renderApp(`/partidas/nueva?videojuego=${juego._id}`);
  const fecha = await screen.findByLabelText("Fecha de inicio");
  fireEvent.change(fecha, { target: { value: "2026-11-15" } });
  fireEvent.change(screen.getByLabelText("Duración (minutos)"), {
    target: { value: "90" },
  });
  fireEvent.change(screen.getByLabelText("Avance (%)"), {
    target: { value: "25" },
  });
  await user.type(screen.getByLabelText("Notas (opcional)"), "Sesión civil");
  await user.click(screen.getByRole("button", { name: "Guardar partida" }));
  await screen.findByRole("heading", { name: juego.nombre });
  expect(enviados).toEqual([
    {
      videojuego: juego._id,
      fecha: "2026-11-15",
      duracionMinutos: 90,
      porcentajeAvance: 25,
      notas: "Sesión civil",
    },
  ]);
  expect(window.location.pathname).toBe(`/videojuegos/${juego._id}`);
  expect(screen.getAllByText("15/11/2026")).toHaveLength(2);
  expect(screen.getByText("1h 30m")).toBeInTheDocument();
  expect(screen.getByRole("checkbox")).toBeChecked();
  expect(
    screen.getByRole("button", { name: "Eliminar partida" }),
  ).toBeInTheDocument();
});

test.each(["", "2026-11-16"])(
  "fecha %j impide envío por validación nativa sin perder campos",
  async (valor) => {
    const user = userEvent.setup();
    renderApp(`/partidas/nueva?videojuego=${juego._id}`);
    const fecha = await screen.findByLabelText("Fecha de inicio");
    fireEvent.change(fecha, { target: { value: valor } });
    await user.click(screen.getByRole("button", { name: "Guardar partida" }));
    expect(fecha).toBeInvalid();
    expect(enviados).toEqual([]);
    expect(screen.getByLabelText("Duración (minutos)")).toHaveValue(60);
  },
);

test.each(["UTC", "America/Guayaquil", "Asia/Tokyo", "America/Los_Angeles"])(
  "historial general muestra solo el día UTC, aun con TZ %s",
  async (zona) => {
    const anterior = process.env.TZ;
    try {
      process.env.TZ = zona;
      partidas = [registro()];
      renderApp("/partidas");
      expect(
        await screen.findByText("15/11/2026 · Sesión civil"),
      ).toBeInTheDocument();
      expect(screen.queryByText(/00:00|19:00/)).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: juego.nombre })).toHaveAttribute(
        "href",
        `/videojuegos/${juego._id}`,
      );
      expect(partidas[0].fecha).toBe("2026-11-15T00:00:00.000Z");
    } finally {
      if (anterior === undefined) delete process.env.TZ;
      else process.env.TZ = anterior;
    }
  },
);

test("detalle interpreta el día UTC legado sin recuperar una hora local inventada", async () => {
  partidas = [registro("2026-11-16T02:30:00.000Z")];
  renderApp(`/videojuegos/${juego._id}`);
  await waitFor(() =>
    expect(screen.getAllByText("16/11/2026")).toHaveLength(2),
  );
  expect(partidas[0].fecha).toBe("2026-11-16T02:30:00.000Z");
});

test("resumen sin sesiones conserva su estado vacío", async () => {
  renderApp(`/videojuegos/${juego._id}`);
  expect(await screen.findByText("Sin sesiones")).toBeInTheDocument();
  expect(
    screen.getByText("Todavía no hay sesiones registradas."),
  ).toBeInTheDocument();
});
