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
import { juegoE2, metaE2, pendiente } from "./fixtures/e2";
import { instalarApiMetas, jsonApi } from "./fixtures/metas-http";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
let api: ReturnType<typeof instalarApiMetas>;
beforeEach(() => {
  api = instalarApiMetas();
});
async function abrir() {
  const user = userEvent.setup();
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  render(<App />, { container: document.getElementById("root")! });
  await user.click(await screen.findByRole("button", { name: "Editar meta" }));
  return user;
}
function cambiar(horas: string, minutos = "0", dias = "3") {
  for (const [campo, valor] of [
    ["Horas", horas],
    ["Minutos", minutos],
    ["Días por semana", dias],
  ])
    fireEvent.change(screen.getByLabelText(campo), {
      target: { value: valor },
    });
}
const escrituras = () => api.solicitudes.filter((s) => s.metodo === "PUT");
test("FE-04: precarga objetivos y PUT omite dueño, estado e hitos sin perderlos", async () => {
  api.meta!.hitos = [
    {
      _id: "2123456789abcdef01234567",
      descripcion: "Final",
      porcentajeObjetivo: 100,
    },
  ];
  api.meta!.minutosObjetivo = 330;
  const user = await abrir();
  expect(screen.getByLabelText("Horas")).toHaveValue(5);
  expect(screen.getByLabelText("Minutos")).toHaveValue(30);
  cambiar("7", "0", "2");
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByText("Meta actualizada. Progreso actualizado.");
  expect(escrituras()).toEqual([
    {
      metodo: "PUT",
      ruta: `/api/metas/${metaE2._id}`,
      datos: { minutosObjetivo: 420, diasPorSemana: 2 },
    },
  ]);
  expect(api.meta!.hitos).toHaveLength(1);
  expect(screen.getByText("Meta semanal cumplida")).toBeInTheDocument();
  expect(screen.getByText("20")).toBeInTheDocument();
});
test.each([
  ["0", "0", "3"],
  ["100", "1", "3"],
  ["1.5", "0", "3"],
  ["1", "60", "3"],
  ["1", "0", "8"],
])("FE-04: inválido %s:%s/%s conserva campos sin PUT", async (h, m, d) => {
  const user = await abrir();
  cambiar(h, m, d);
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/Revisa los campos/);
  expect(escrituras()).toHaveLength(0);
});
test("FE-04: cancelar no escribe", async () => {
  const user = await abrir();
  cambiar("9");
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(escrituras()).toHaveLength(0);
  expect(screen.queryByLabelText("Horas")).not.toBeInTheDocument();
});
test("FE-04: doble submit envía un único PUT", async () => {
  const p = pendiente<Response>();
  api.actualizar = () => p.promesa;
  await abrir();
  cambiar("7", "0", "2");
  const form = screen.getByRole("form", { name: "Editar meta semanal" });
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(escrituras()).toHaveLength(1));
  expect(screen.getByLabelText("Horas")).toBeDisabled();
  await act(async () => {
    api.meta = { ...metaE2, minutosObjetivo: 420, diasPorSemana: 2 };
    p.resolver(jsonApi(api.meta));
  });
  await screen.findByText("Meta actualizada. Progreso actualizado.");
});
test("FE-04: 400 conserva borrador y permite reintento manual", async () => {
  api.actualizar = async () =>
    jsonApi(
      {
        error: "Días rechazados",
        requestId: "editar-prueba",
        detalles: [{ campo: "diasPorSemana", mensaje: "Revisa los días" }],
      },
      400,
    );
  const user = await abrir();
  cambiar("7", "30", "2");
  const horas = screen.getByLabelText("Horas");
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Horas")).toBe(horas);
  expect(horas).toHaveValue(7);
  expect(screen.getByText(/editar-prueba/)).toBeInTheDocument();
  api.actualizar = undefined;
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByText("Meta actualizada. Progreso actualizado.");
});
test("FE-04: 409 por desactivación no permite editar la inactiva y conserva borrador", async () => {
  api.actualizar = async () => {
    api.meta = null;
    return jsonApi({ error: "Meta inactiva" }, 409);
  };
  const user = await abrir();
  cambiar("9");
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByText(/La meta cambió de estado/);
  expect(screen.getByLabelText("Horas")).toHaveValue(9);
  expect(
    screen.getByRole("button", { name: "Guardar cambios" }),
  ).toBeDisabled();
  expect(escrituras()).toHaveLength(1);
});
test("FE-04: PUT confirmado y GET fallido reintenta solo lectura", async () => {
  api.actualizar = async (datos) => {
    api.meta = { ...api.meta!, ...datos };
    api.fallosProgreso = 1;
    return jsonApi(api.meta);
  };
  const user = await abrir();
  cambiar("7");
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await screen.findByText(
    /Los cambios se guardaron, pero no pudimos actualizar/,
  );
  await user.click(
    screen.getByRole("button", { name: "Reintentar actualización" }),
  );
  await screen.findByText("Meta actualizada. Progreso actualizado.");
  expect(escrituras()).toHaveLength(1);
});
test.each(["Completado", "Abandonado"])(
  "FE-04: edición disponible en %s",
  async (estado) => {
    api.juego.estado = estado as "Completado" | "Abandonado";
    const user = await abrir();
    cambiar("2");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await screen.findByText("Meta actualizada. Progreso actualizado.");
  },
);

test("INT-03: refrescar por foco conserva el borrador abierto aunque cambie la meta del servidor", async () => {
  await abrir();
  cambiar("9");
  const campo = screen.getByLabelText("Horas");
  api.meta!.minutosObjetivo = 600;
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await waitFor(() =>
    expect(
      api.solicitudes.filter((s) => s.ruta.endsWith("/progreso")),
    ).toHaveLength(2),
  );
  expect(screen.getByLabelText("Horas")).toBe(campo);
  expect(campo).toHaveValue(9);
  expect(escrituras()).toHaveLength(0);
});
