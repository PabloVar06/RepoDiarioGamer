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
import { juegoE2, pendiente } from "./fixtures/e2";
import { instalarApiMetas, jsonApi } from "./fixtures/metas-http";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
let api: ReturnType<typeof instalarApiMetas>;
beforeEach(() => {
  api = instalarApiMetas();
  // jsdom no implementa los métodos nativos; navegador real se verifica al final.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});
async function abrir() {
  const user = userEvent.setup();
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  render(<App />, { container: document.getElementById("root")! });
  const disparador = await screen.findByRole("button", {
    name: "Desactivar meta",
  });
  await user.click(disparador);
  return { user, disparador };
}
const bajas = () => api.solicitudes.filter((s) => s.metodo === "DELETE");
test("FE-05: abrir no elimina, Cancelar tiene foco y devuelve foco al disparador", async () => {
  const { user, disparador } = await abrir();
  const dialogo = screen.getByRole("dialog", { name: "Desactivar meta" });
  expect(dialogo).toHaveAccessibleDescription(/conserva/);
  expect(
    within(dialogo).getByRole("button", { name: "Cancelar" }),
  ).toHaveFocus();
  expect(bajas()).toHaveLength(0);
  await user.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(disparador).toHaveFocus();
});
test("FE-05: Escape/cancel nativo cierra sin DELETE", async () => {
  await abrir();
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: true, cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(bajas()).toHaveLength(0);
});

test("FE-05: retorno al disparador incluso si la apertura programática no le dio foco", async () => {
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  render(<App />, { container: document.getElementById("root")! });
  const disparador = await screen.findByRole("button", {
    name: "Desactivar meta",
  });
  fireEvent.click(disparador);
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(disparador).toHaveFocus();
});
test("FE-05: confirmar una vez respeta 204 y conserva actividad/avance/rachas sin meta", async () => {
  const { user } = await abrir();
  await user.click(
    screen.getByRole("button", { name: "Confirmar desactivación" }),
  );
  await screen.findByText("Meta desactivada. Tu actividad se conserva.");
  expect(bajas()).toHaveLength(1);
  expect(screen.getByText("Sin meta activa")).toBeInTheDocument();
  expect(screen.getByText("7 h")).toBeInTheDocument();
  expect(screen.getByText("80 %")).toBeInTheDocument();
  expect(screen.getByText("5 días")).toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cerrar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Volver a la biblioteca/ }),
  ).toHaveFocus();
});
test("FE-05: doble confirmación pendiente no duplica DELETE ni permite Escape", async () => {
  const p = pendiente<Response>();
  api.desactivar = () => p.promesa;
  await abrir();
  const boton = screen.getByRole("button", { name: "Confirmar desactivación" });
  fireEvent.click(boton);
  fireEvent.click(boton);
  await waitFor(() => expect(bajas()).toHaveLength(1));
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await act(async () => {
    api.meta = null;
    p.resolver(new Response(null, { status: 204 }));
  });
  await screen.findByText("Meta desactivada. Tu actividad se conserva.");
});
test("FE-05: DELETE confirmado y GET fallido reintenta solo consulta", async () => {
  api.desactivar = async () => {
    api.meta = null;
    api.fallosProgreso = 1;
    return new Response(null, { status: 204 });
  };
  const { user } = await abrir();
  await user.click(
    screen.getByRole("button", { name: "Confirmar desactivación" }),
  );
  await screen.findByText(/La meta se desactivó, pero no pudimos actualizar/);
  await user.click(
    screen.getByRole("button", { name: "Reintentar actualización" }),
  );
  await screen.findByText("Meta desactivada. Tu actividad se conserva.");
  expect(bajas()).toHaveLength(1);
});
test("FE-05: red incierta reconsulta antes de reintentar y evita nueva baja si ya se desactivó", async () => {
  api.desactivar = async () => {
    api.meta = null;
    throw new TypeError("Red");
  };
  const { user } = await abrir();
  await user.click(
    screen.getByRole("button", { name: "Confirmar desactivación" }),
  );
  await screen.findByText(/No podemos confirmar la desactivación/);
  await user.click(screen.getByRole("button", { name: "Comprobar estado" }));
  await screen.findByText(
    "La meta anterior ya no está activa. Tu actividad se conserva.",
  );
  expect(bajas()).toHaveLength(1);
});
test("FE-05: 500 conserva diálogo y permite reintento explícito tras consultar meta vigente", async () => {
  api.desactivar = async () =>
    jsonApi({ error: "No disponible", requestId: "desactivar-prueba" }, 500);
  const { user } = await abrir();
  await user.click(
    screen.getByRole("button", { name: "Confirmar desactivación" }),
  );
  await screen.findByText(/No podemos confirmar la desactivación/);
  expect(screen.getByText(/desactivar-prueba/)).toBeInTheDocument();
  api.desactivar = undefined;
  await user.click(screen.getByRole("button", { name: "Comprobar estado" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirmar desactivación" }),
    ).toBeEnabled(),
  );
  await user.click(
    screen.getByRole("button", { name: "Confirmar desactivación" }),
  );
  await screen.findByText("Meta desactivada. Tu actividad se conserva.");
  expect(bajas()).toHaveLength(2);
});
