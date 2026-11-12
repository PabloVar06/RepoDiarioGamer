import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import type { Partida, Videojuego } from "../src/tipos";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));

const juego: Videojuego = {
  _id: "0123456789abcdef01234567",
  nombre: "Juego recuperable",
  plataforma: "PC",
  genero: "Rol",
  estado: "Jugando",
  logros: [],
};
const datos = {
  videojuego: juego._id,
  fecha: "2026-11-15",
  duracionMinutos: 90,
  porcentajeAvance: 25,
  notas: "Conservar este borrador",
};
type Fallo = {
  nombre: string;
  respuesta: () => Promise<Response>;
  mensaje: string;
};
const fallos: Fallo[] = [
  {
    nombre: "400",
    respuesta: async () =>
      new Response(JSON.stringify({ error: "Duración rechazada" }), {
        status: 400,
      }),
    mensaje: "Duración rechazada",
  },
  {
    nombre: "500",
    respuesta: async () =>
      new Response(JSON.stringify({ error: "Error interno del servidor" }), {
        status: 500,
      }),
    mensaje: "Error interno del servidor",
  },
  {
    nombre: "500 sin JSON",
    respuesta: async () => new Response("<html>Error</html>", { status: 500 }),
    mensaje: "Error HTTP 500",
  },
  {
    nombre: "red",
    respuesta: async () => {
      throw new Error("Conexión interrumpida");
    },
    mensaje: "Conexión interrumpida",
  },
];

let enviados: Record<string, unknown>[];
let respuestas: (() => Promise<Response>)[];
let partidas: Partida[];
let catalogo: Videojuego[] | Promise<Videojuego[]> | Error;

function pendiente<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
function renderApp() {
  window.history.replaceState(
    {},
    "",
    `/partidas/nueva?videojuego=${juego._id}`,
  );
  return render(<App />, { container: document.getElementById("root")! });
}
function campos() {
  return {
    videojuego: screen.getByLabelText("Videojuego"),
    fecha: screen.getByLabelText("Fecha de inicio"),
    duracion: screen.getByLabelText("Duración (minutos)"),
    avance: screen.getByLabelText("Avance (%)"),
    notas: screen.getByLabelText("Notas (opcional)"),
  };
}
async function preparar() {
  renderApp();
  await screen.findByLabelText("Fecha de inicio");
  const c = campos();
  fireEvent.change(c.fecha, { target: { value: datos.fecha } });
  fireEvent.change(c.duracion, { target: { value: "90" } });
  fireEvent.change(c.avance, { target: { value: "25" } });
  fireEvent.change(c.notas, { target: { value: datos.notas } });
  return c;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T17:00:00Z"));
  enviados = [];
  respuestas = [];
  partidas = [];
  catalogo = [juego];
  // Clientes reales: solo transporte simulado, sin red ni backend externo.
  vi.mocked(fetch).mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname;
    if (options?.method === "POST" && path === "/api/partidas") {
      const payload = JSON.parse(String(options.body));
      enviados.push(payload);
      const responder = respuestas.shift();
      if (responder) return responder();
      const creada = {
        ...payload,
        _id: "2123456789abcdef01234567",
        fecha: `${payload.fecha}T00:00:00.000Z`,
      };
      partidas.push(creada);
      return new Response(JSON.stringify(creada), { status: 201 });
    }
    let body: unknown;
    if (path === "/api/videojuegos") {
      if (catalogo instanceof Error)
        return new Response(JSON.stringify({ error: catalogo.message }), {
          status: 503,
        });
      body = await catalogo;
    } else if (path === `/api/videojuegos/${juego._id}`) body = juego;
    else if (path === `/api/videojuegos/${juego._id}/partidas`) body = partidas;
    else if (path === `/api/videojuegos/${juego._id}/resumen`)
      body = {
        totalPartidas: 1,
        horasTotales: 2,
        ultimaPartida: "2026-11-15T00:00:00.000Z",
        porcentajeAvanceActual: 25,
      };
    else if (path === "/api/partidas") body = [];
    else throw new Error(`Ruta no simulada: ${path}`);
    return new Response(JSON.stringify(body));
  });
});
afterEach(() => vi.useRealTimers());

test.each(fallos)(
  "envío $nombre conserva los mismos controles y valores, sin reintento automático",
  async ({ respuesta, mensaje }) => {
    const user = userEvent.setup();
    respuestas.push(respuesta);
    const originales = await preparar();
    await user.click(screen.getByRole("button", { name: "Guardar partida" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(mensaje);
    const actuales = campos();
    for (const k of Object.keys(originales) as (keyof typeof originales)[])
      expect(actuales[k]).toBe(originales[k]);
    expect(actuales.videojuego).toHaveValue(juego._id);
    expect(actuales.fecha).toHaveValue(datos.fecha);
    expect(actuales.duracion).toHaveValue(90);
    expect(actuales.avance).toHaveValue(25);
    expect(actuales.notas).toHaveValue(datos.notas);
    expect(
      screen.getByRole("button", { name: "Guardar partida" }),
    ).toBeEnabled();
    expect(enviados).toEqual([datos]);
    expect(window.location.pathname).toBe("/partidas/nueva");
    expect(screen.queryByText(/Todavía no hay datos/)).not.toBeInTheDocument();
  },
);

test("corregir y reintentar manualmente limpia el error, conserva borrador pendiente y navega tras éxito", async () => {
  const user = userEvent.setup();
  const siguiente = pendiente<Response>();
  respuestas.push(fallos[0].respuesta, () => siguiente.promise);
  const originales = await preparar();
  await user.click(screen.getByRole("button", { name: "Guardar partida" }));
  await screen.findByRole("alert");
  fireEvent.change(campos().duracion, { target: { value: "120" } });
  await user.click(screen.getByRole("button", { name: "Guardar partida" }));
  await waitFor(() => expect(enviados).toHaveLength(2));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(campos().notas).toBe(originales.notas);
  expect(campos().notas).toHaveValue(datos.notas);
  expect(campos().fecha).toHaveValue(datos.fecha);
  expect(window.location.pathname).toBe("/partidas/nueva");
  expect(enviados).toEqual([datos, { ...datos, duracionMinutos: 120 }]);
  await act(async () => {
    siguiente.resolve(
      new Response(
        JSON.stringify({
          ...datos,
          duracionMinutos: 120,
          _id: "2123456789abcdef01234567",
          fecha: `${datos.fecha}T00:00:00.000Z`,
        }),
        { status: 201 },
      ),
    );
    await siguiente.promise;
  });
  expect(
    await screen.findByRole("heading", { name: juego.nombre }),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe(`/videojuegos/${juego._id}`);
  expect(enviados).toHaveLength(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("un segundo fallo actualiza el aviso sin borrar las correcciones", async () => {
  const user = userEvent.setup();
  respuestas.push(fallos[0].respuesta, fallos[1].respuesta);
  await preparar();
  await user.click(screen.getByRole("button", { name: "Guardar partida" }));
  await screen.findByRole("alert");
  fireEvent.change(campos().notas, {
    target: { value: "Corrección conservada" },
  });
  await user.click(screen.getByRole("button", { name: "Guardar partida" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(fallos[1].mensaje),
  );
  expect(screen.getByRole("alert")).not.toHaveTextContent(fallos[0].mensaje);
  expect(campos().notas).toHaveValue("Corrección conservada");
  expect(enviados).toHaveLength(2);
});

test("cancelar después de un fallo conserva la navegación E1 sin otro POST", async () => {
  const user = userEvent.setup();
  respuestas.push(fallos[0].respuesta);
  await preparar();
  await user.click(screen.getByRole("button", { name: "Guardar partida" }));
  await screen.findByRole("alert");
  await user.click(screen.getByRole("link", { name: "Cancelar" }));
  expect(
    await screen.findByRole("heading", { name: "Mis partidas" }),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe("/partidas");
  expect(enviados).toHaveLength(1);
});

test("carga inicial del catálogo se distingue de error de envío y luego muestra el formulario", async () => {
  const lista = pendiente<Videojuego[]>();
  catalogo = lista.promise;
  renderApp();
  expect(await screen.findByText("Cargando datos…")).toBeInTheDocument();
  expect(screen.queryByLabelText("Fecha de inicio")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await act(async () => {
    lista.resolve([juego]);
    await lista.promise;
  });
  expect(await screen.findByLabelText("Fecha de inicio")).toBeInTheDocument();
  expect(screen.queryByText("Cargando datos…")).not.toBeInTheDocument();
  expect(enviados).toEqual([]);
});

test("catálogo vacío mantiene vacío real sin ofrecer envío", async () => {
  catalogo = [];
  renderApp();
  expect(
    await screen.findByText("Todavía no hay datos. ¡Añade el primero!"),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Guardar partida" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(enviados).toEqual([]);
});

test("error al cargar catálogo conserva su mensaje y no se presenta como fallo de guardado", async () => {
  catalogo = new Error("No pudimos cargar videojuegos");
  renderApp();
  expect(
    await screen.findByText("No pudimos cargar videojuegos"),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Fecha de inicio")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(enviados).toEqual([]);
});
