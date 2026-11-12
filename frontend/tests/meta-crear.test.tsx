import { beforeEach, expect, test, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import type { MetaDTO } from "../src/tipos";
import {
  juegoE2,
  metaE2,
  pendiente,
  progresoE2,
  rachasE2,
} from "./fixtures/e2";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
let activa: MetaDTO | null;
let estado = "Jugando";
let cargasFallidas: number;
let solicitudes: string[];
let envios: Record<string, unknown>[];
let responder: (() => Promise<Response>) | undefined;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
beforeEach(() => {
  activa = null;
  estado = "Jugando";
  cargasFallidas = 0;
  solicitudes = [];
  envios = [];
  responder = undefined;
  vi.mocked(fetch).mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname;
    const method = options?.method ?? "GET";
    solicitudes.push(`${method} ${path}`);
    if (path === "/api/metas" && method === "POST") {
      const datos = JSON.parse(String(options?.body));
      envios.push(datos);
      if (responder) return responder();
      activa = { ...metaE2, ...datos };
      return json(activa, 201);
    }
    if (path.endsWith("/progreso")) {
      if (cargasFallidas > 0) {
        cargasFallidas--;
        return json({ error: "Fallo de lectura" }, 500);
      }
      return json(
        progresoE2({
          meta: activa,
          porcentajeHoras: activa ? 140 : null,
          metaCumplida: activa ? false : null,
          minutosSemana: 420,
          horasSemana: 7,
          diasJugados: 2,
        }),
      );
    }
    if (path === "/api/rachas") return json(rachasE2());
    if (path === `/api/videojuegos/${juegoE2._id}`)
      return json({ ...juegoE2, estado });
    if (path.endsWith("/partidas")) return json([]);
    if (path.endsWith("/resumen"))
      return json({
        totalPartidas: 4,
        horasTotales: 20,
        ultimaPartida: null,
        porcentajeAvanceActual: 80,
      });
    throw new Error(`Ruta no simulada: ${method} ${path}`);
  });
});
async function abrir() {
  const user = userEvent.setup();
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  render(<App />, { container: document.getElementById("root")! });
  await user.click(await screen.findByRole("button", { name: "Crear meta" }));
  return user;
}
function completar(horas = "5", minutos = "0", dias = "3") {
  fireEvent.change(screen.getByLabelText("Horas"), {
    target: { value: horas },
  });
  fireEvent.change(screen.getByLabelText("Minutos"), {
    target: { value: minutos },
  });
  fireEvent.change(screen.getByLabelText("Días por semana"), {
    target: { value: dias },
  });
}
test("FE-03: crear convierte una vez a minutos y reconsulta cumplimiento sin perder E1", async () => {
  const user = await abrir();
  completar();
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  expect(
    await screen.findByText("Meta creada. Progreso actualizado."),
  ).toHaveAttribute("role", "status");
  expect(envios).toEqual([
    { videojuego: juegoE2._id, minutosObjetivo: 300, diasPorSemana: 3 },
  ]);
  expect(screen.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  expect(screen.getByText("140 %")).toBeInTheDocument();
  expect(
    screen.getByText("Meta semanal pendiente: requiere horas y días"),
  ).toBeInTheDocument();
  expect(screen.getByText("20")).toBeInTheDocument();
  expect(screen.getByText("5 días")).toBeInTheDocument();
  expect(solicitudes.filter((s) => s.endsWith("/progreso"))).toHaveLength(2);
});
test.each([
  ["0", "1", "1", 1],
  ["100", "0", "7", 6000],
])(
  "FE-03: límites válidos %s h %s min / %s días",
  async (horas, minutos, dias, objetivo) => {
    const user = await abrir();
    completar(horas, minutos, dias);
    await user.click(screen.getByRole("button", { name: "Guardar meta" }));
    await screen.findByText("Meta creada. Progreso actualizado.");
    expect(envios[0].minutosObjetivo).toBe(objetivo);
    expect(envios[0].diasPorSemana).toBe(Number(dias));
  },
);
test.each([
  ["0", "0", "3", "Horas"],
  ["101", "0", "3", "Horas"],
  ["100", "1", "3", "Horas"],
  ["1.5", "0", "3", "Horas"],
  ["", "0", "3", "Horas"],
  ["-1", "0", "3", "Horas"],
  ["1", "60", "3", "Minutos"],
  ["1", "0.5", "3", "Minutos"],
  ["1", "", "3", "Minutos"],
  ["1", "0", "0", "Días por semana"],
  ["1", "0", "8", "Días por semana"],
  ["1", "0", "1.5", "Días por semana"],
])(
  "FE-03: inválido %s:%s / %s no envía y explica junto a %s",
  async (horas, minutos, dias, campo) => {
    const user = await abrir();
    completar(horas, minutos, dias);
    await user.click(screen.getByRole("button", { name: "Guardar meta" }));
    expect(envios).toHaveLength(0);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Revisa los campos indicados",
    );
    expect(screen.getByLabelText(campo)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText(campo)).toHaveAccessibleDescription();
  },
);
test("FE-03: cancelar no escribe y una meta activa no ofrece creación", async () => {
  const user = await abrir();
  completar();
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(envios).toHaveLength(0);
  expect(screen.queryByLabelText("Horas")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Crear meta" }),
  ).toBeInTheDocument();
});
test("FE-03: doble submit pendiente produce un único POST", async () => {
  const respuesta = pendiente<Response>();
  responder = () => respuesta.promesa;
  await abrir();
  completar();
  const form = screen.getByRole("form", { name: "Crear meta semanal" });
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  expect(screen.getByLabelText("Horas")).toBeDisabled();
  await waitFor(() => expect(envios).toHaveLength(1));
  await act(async () => {
    activa = metaE2;
    respuesta.resolver(json(metaE2, 201));
  });
  await screen.findByText("Meta creada. Progreso actualizado.");
  expect(envios).toHaveLength(1);
});
test("FE-03: 400 mantiene nodos/valores, muestra requestId y detalles; reintento manual recupera", async () => {
  responder = async () =>
    json(
      {
        error: "Revisa los objetivos",
        requestId: "solicitud-prueba",
        detalles: [{ campo: "diasPorSemana", mensaje: "Días rechazados" }],
      },
      400,
    );
  const user = await abrir();
  completar();
  const horas = screen.getByLabelText("Horas");
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Revisa los objetivos",
  );
  expect(screen.getByText("Días rechazados")).toBeInTheDocument();
  expect(screen.getByText(/solicitud-prueba/)).toBeInTheDocument();
  expect(screen.getByLabelText("Horas")).toBe(horas);
  expect(horas).toHaveValue(5);
  responder = undefined;
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  await screen.findByText("Meta creada. Progreso actualizado.");
  expect(envios).toHaveLength(2);
});
test("FE-03: 409 informa, reconsulta y conserva borrador sin otro POST", async () => {
  responder = async () => {
    activa = metaE2;
    return json({ error: "Ya existe una meta activa" }, 409);
  };
  const user = await abrir();
  completar("2", "30", "4");
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /Ya existe una meta activa/,
  );
  await waitFor(() =>
    expect(screen.getByRole("progressbar")).toBeInTheDocument(),
  );
  expect(screen.getByLabelText("Horas")).toHaveValue(2);
  expect(screen.getByLabelText("Minutos")).toHaveValue(30);
  expect(envios).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Guardar meta" })).toBeDisabled();
});
test("FE-03: POST confirmado y GET fallido reintenta solo lectura", async () => {
  responder = async () => {
    activa = metaE2;
    cargasFallidas = 1;
    return json(metaE2, 201);
  };
  const user = await abrir();
  completar();
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  expect(
    await screen.findByText(/La meta se creó, pero no pudimos actualizar/),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Horas")).toHaveValue(5);
  await user.click(
    screen.getByRole("button", { name: "Reintentar actualización" }),
  );
  await screen.findByText("Meta creada. Progreso actualizado.");
  expect(envios).toHaveLength(1);
});
test.each([false, true])(
  "FE-03: red incierta, escritura previa=%s, obliga a reconsultar antes de otro POST",
  async (guardada) => {
    responder = async () => {
      if (guardada) activa = metaE2;
      throw new TypeError("Conexión interrumpida");
    };
    const user = await abrir();
    completar();
    await user.click(screen.getByRole("button", { name: "Guardar meta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No podemos confirmar/,
    );
    expect(screen.getByRole("button", { name: "Guardar meta" })).toBeDisabled();
    responder = undefined;
    await user.click(
      screen.getByRole("button", { name: "Reconsultar antes de guardar" }),
    );
    if (guardada) {
      await screen.findByText(/Ya existe una meta activa/);
      expect(
        screen.getByRole("button", { name: "Guardar meta" }),
      ).toBeDisabled();
    } else {
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Guardar meta" }),
        ).toBeEnabled(),
      );
      expect(envios).toHaveLength(1);
      await user.click(screen.getByRole("button", { name: "Guardar meta" }));
      await screen.findByText("Meta creada. Progreso actualizado.");
    }
    expect(envios).toHaveLength(guardada ? 1 : 2);
  },
);
test.each(["Completado", "Abandonado"])(
  "FE-03: permite crear en estado %s",
  async (valor) => {
    estado = valor;
    const user = await abrir();
    completar();
    await user.click(screen.getByRole("button", { name: "Guardar meta" }));
    await screen.findByText("Meta creada. Progreso actualizado.");
    expect(envios).toHaveLength(1);
  },
);

test("FE-03: meta ya activa no ofrece creación", async () => {
  activa = metaE2;
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  render(<App />, { container: document.getElementById("root")! });
  await screen.findByRole("progressbar");
  expect(
    screen.queryByRole("button", { name: "Crear meta" }),
  ).not.toBeInTheDocument();
  expect(envios).toHaveLength(0);
});

test("FE-03: 500 no JSON conserva el formulario y exige consulta antes de reintentar", async () => {
  responder = async () =>
    new Response("<html>detalle privado</html>", { status: 500 });
  const user = await abrir();
  completar();
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /No podemos confirmar/,
  );
  expect(screen.queryByText(/detalle privado/)).not.toBeInTheDocument();
  expect(screen.getByLabelText("Horas")).toHaveValue(5);
  responder = undefined;
  await user.click(
    screen.getByRole("button", { name: "Reconsultar antes de guardar" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Guardar meta" })).toBeEnabled(),
  );
  expect(envios).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  await screen.findByText("Meta creada. Progreso actualizado.");
  expect(envios).toHaveLength(2);
});

test("FE-03: respuesta de creación ilegible obliga a consultar y evita duplicar la meta guardada", async () => {
  responder = async () => {
    activa = metaE2;
    return new Response("no JSON", { status: 201 });
  };
  const user = await abrir();
  completar();
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  await screen.findByRole("alert");
  await user.click(
    screen.getByRole("button", { name: "Reconsultar antes de guardar" }),
  );
  await screen.findByText(/Ya existe una meta activa/);
  expect(envios).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Guardar meta" })).toBeDisabled();
});

test("FE-03: consulta de resultado incierto fallida mantiene el bloqueo hasta verificar ausencia", async () => {
  responder = async () => {
    throw new TypeError("Red interrumpida");
  };
  const user = await abrir();
  completar();
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  await screen.findByRole("alert");
  cargasFallidas = 1;
  await user.click(
    screen.getByRole("button", { name: "Reconsultar antes de guardar" }),
  );
  await screen.findByText(/No pudimos comprobar si existe/);
  expect(screen.getByRole("button", { name: "Guardar meta" })).toBeDisabled();
  expect(envios).toHaveLength(1);
  await user.click(
    screen.getByRole("button", { name: "Reconsultar antes de guardar" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Guardar meta" })).toBeEnabled(),
  );
  expect(envios).toHaveLength(1);
});
