import { beforeEach, expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { juegoE2 } from "./fixtures/e2";
import { instalarApiMetas, jsonApi } from "./fixtures/metas-http";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
let api: ReturnType<typeof instalarApiMetas>;
beforeEach(() => {
  api = instalarApiMetas();
});
function montar() {
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  return render(<App />, { container: document.getElementById("root")! });
}
async function editar() {
  const user = userEvent.setup();
  montar();
  await user.click(await screen.findByRole("button", { name: "Editar meta" }));
  return user;
}
async function agregar(
  user: ReturnType<typeof userEvent.setup>,
  descripcion = "Inicio",
  porcentaje = "75",
  indice = 1,
) {
  await user.click(screen.getByRole("button", { name: "Añadir hito" }));
  fireEvent.change(screen.getByLabelText(`Descripción del hito ${indice}`), {
    target: { value: descripcion },
  });
  fireEvent.change(
    screen.getByLabelText(`Porcentaje objetivo del hito ${indice}`),
    { target: { value: porcentaje } },
  );
}
test("FE-06: lista alcanzado/pendiente usa DTO y máximo E1; no incorpora checkboxes", async () => {
  api.meta!.hitos = [
    {
      _id: "2123456789abcdef01234567",
      descripcion: "Avance alto",
      porcentajeObjetivo: 75,
    },
    {
      _id: "3123456789abcdef01234567",
      descripcion: "Final",
      porcentajeObjetivo: 100,
    },
  ];
  montar();
  const lista = await screen.findByRole("region", { name: "Hitos de la meta" });
  expect(within(lista).getByText("Avance alto")).toBeInTheDocument();
  expect(within(lista).getByText("Alcanzado")).toBeInTheDocument();
  expect(within(lista).getByText("Pendiente")).toBeInTheDocument();
  expect(within(lista).queryByRole("checkbox")).not.toBeInTheDocument();
});
test("FE-06: conserva IDs al renombrar, genera nuevos solo en backend y envía lista completa", async () => {
  const id = "2123456789abcdef01234567";
  api.meta!.hitos = [{ _id: id, descripcion: "Antes", porcentajeObjetivo: 75 }];
  const user = await editar();
  fireEvent.change(screen.getByLabelText("Descripción del hito 1"), {
    target: { value: "  Después  " },
  });
  await agregar(user, "Final", "100", 2);
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByText("Meta actualizada. Progreso actualizado.");
  const datos = api.solicitudes.find((s) => s.metodo === "PUT")!.datos!;
  expect(datos.hitos).toEqual([
    { _id: id, descripcion: "Después", porcentajeObjetivo: 75 },
    { descripcion: "Final", porcentajeObjetivo: 100 },
  ]);
});
test("FE-06: quitar todos envía [] y no altera logros E1", async () => {
  api.juego.logros = [
    { _id: "4123456789abcdef01234567", nombre: "Manual E1", obtenido: true },
  ];
  api.meta!.hitos = [
    {
      _id: "2123456789abcdef01234567",
      descripcion: "Inicio",
      porcentajeObjetivo: 1,
    },
  ];
  const user = await editar();
  await user.click(screen.getByRole("button", { name: "Quitar hito 1" }));
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByText("Meta actualizada. Progreso actualizado.");
  expect(api.solicitudes.find((s) => s.metodo === "PUT")!.datos!.hitos).toEqual(
    [],
  );
  expect(screen.getByRole("checkbox", { name: "Manual E1" })).toBeChecked();
});
test("FE-06: permite cinco hitos, bloquea sexto y acepta objetivos/descripciones repetidos", async () => {
  const user = await editar();
  for (let i = 1; i <= 5; i++) await agregar(user, "Repetido", "1", i);
  expect(screen.getByRole("button", { name: "Añadir hito" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByText("Meta actualizada. Progreso actualizado.");
  expect(api.meta!.hitos).toHaveLength(5);
});
test.each([
  ["", "75"],
  ["   ", "75"],
  ["x".repeat(121), "75"],
  ["Inicio", "0"],
  ["Inicio", "101"],
  ["Inicio", "1.5"],
  ["Inicio", ""],
])(
  "FE-06: invalida descripción/pct %j/%s sin escribir",
  async (descripcion, porcentaje) => {
    const user = await editar();
    await agregar(user, descripcion, porcentaje);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Revisa los campos/);
    expect(api.solicitudes.filter((s) => s.metodo === "PUT")).toHaveLength(0);
    const invalidos = [
      ...screen.getAllByRole("textbox"),
      ...screen.getAllByRole("spinbutton"),
    ].filter((c) => c.getAttribute("aria-invalid") === "true");
    expect(invalidos.length).toBeGreaterThan(0);
  },
);
test("FE-06: creación con hitos envía descripción recortada sin IDs de cliente", async () => {
  api.meta = null;
  const user = userEvent.setup();
  montar();
  await user.click(await screen.findByRole("button", { name: "Crear meta" }));
  fireEvent.change(screen.getByLabelText("Horas"), { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("Días por semana"), {
    target: { value: "3" },
  });
  await agregar(user, " Inicio ", "1");
  await user.click(screen.getByRole("button", { name: "Guardar meta" }));
  await screen.findByText("Meta creada. Progreso actualizado.");
  expect(
    api.solicitudes.find((s) => s.metodo === "POST")!.datos!.hitos,
  ).toEqual([{ descripcion: "Inicio", porcentajeObjetivo: 1 }]);
});
test("FE-06: fallo de guardado mantiene filas, IDs, valores y detalles del hito", async () => {
  api.meta!.hitos = [
    {
      _id: "2123456789abcdef01234567",
      descripcion: "Inicio",
      porcentajeObjetivo: 1,
    },
  ];
  api.actualizar = async () =>
    jsonApi(
      {
        error: "Hito rechazado",
        detalles: [
          { campo: "hitos.0.descripcion", mensaje: "Revisa descripción" },
        ],
      },
      400,
    );
  const user = await editar();
  const campo = screen.getByLabelText("Descripción del hito 1");
  fireEvent.change(campo, { target: { value: "Borrador" } });
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Descripción del hito 1")).toBe(campo);
  expect(campo).toHaveValue("Borrador");
  expect(campo).toHaveAccessibleDescription(/Revisa descripción/);
});
test("FE-06/INT-01: borrar sesión máxima reconsulta y devuelve hito a pendiente", async () => {
  api.meta!.hitos = [
    {
      _id: "2123456789abcdef01234567",
      descripcion: "75 por ciento",
      porcentajeObjetivo: 75,
    },
  ];
  api.partidas = [
    {
      _id: "6123456789abcdef01234567",
      videojuego: juegoE2._id,
      fecha: "2026-11-08T00:00:00.000Z",
      duracionMinutos: 30,
      porcentajeAvance: 30,
    },
    {
      _id: "5123456789abcdef01234567",
      videojuego: juegoE2._id,
      fecha: "2026-11-09T00:00:00.000Z",
      duracionMinutos: 60,
      porcentajeAvance: 80,
    },
  ];
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  montar();
  await screen.findByText("Alcanzado");
  await user.click(
    screen.getAllByRole("button", { name: "Eliminar partida" })[1],
  );
  await screen.findByText("Pendiente");
  await waitFor(() => expect(api.avance).toBe(30));
});
