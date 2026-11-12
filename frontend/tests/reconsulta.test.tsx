import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { juegoE2 } from "./fixtures/e2";
import { instalarApiMetas } from "./fixtures/metas-http";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
let api: ReturnType<typeof instalarApiMetas>;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T17:00:00Z"));
  api = instalarApiMetas();
});
afterEach(() => vi.useRealTimers());
function montar(ruta: string) {
  window.history.replaceState({}, "", ruta);
  render(<App />, { container: document.getElementById("root")! });
}
const consultas = (sufijo: string) =>
  api.solicitudes.filter((s) => s.metodo === "GET" && s.ruta.endsWith(sufijo))
    .length;
test("INT-01: registrar navega al detalle y obtiene historial, resumen, progreso, hitos y rachas", async () => {
  api.avance = 30;
  api.minutos = 30;
  api.meta!.hitos = [
    {
      _id: "2123456789abcdef01234567",
      descripcion: "Avance 75",
      porcentajeObjetivo: 75,
    },
  ];
  const user = userEvent.setup();
  montar(`/partidas/nueva?videojuego=${juegoE2._id}`);
  const fecha = await screen.findByLabelText("Fecha de inicio");
  fireEvent.change(fecha, { target: { value: "2026-11-11" } });
  fireEvent.change(screen.getByLabelText("Avance (%)"), {
    target: { value: "80" },
  });
  await user.click(screen.getByRole("button", { name: "Guardar partida" }));
  await screen.findByText("Alcanzado");
  expect(window.location.pathname).toBe(`/videojuegos/${juegoE2._id}`);
  for (const ruta of [
    "/resumen",
    "/progreso",
    "/rachas",
    `/${juegoE2._id}/partidas`,
  ])
    expect(consultas(ruta)).toBe(1);
  expect(
    screen.getByRole("region", { name: "Resumen acumulado E1" }),
  ).toBeInTheDocument();
});
test("INT-01: eliminar desde historial general y volver al detalle reconsulta los indicadores", async () => {
  api.partidas = [
    {
      _id: "5123456789abcdef01234567",
      videojuego: juegoE2._id,
      fecha: "2026-11-11T00:00:00.000Z",
      duracionMinutos: 30,
      porcentajeAvance: 80,
    },
  ];
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  montar("/partidas");
  await user.click(
    await screen.findByRole("button", { name: "Eliminar partida" }),
  );
  await screen.findByText("Todavía no hay datos. ¡Añade el primero!");
  await user.click(
    within(
      screen.getByRole("navigation", { name: "Navegación principal" }),
    ).getByRole("link", { name: "Videojuegos" }),
  );
  await user.click(await screen.findByRole("link", { name: /Ver progreso/ }));
  await screen.findByRole("region", { name: "Progreso semanal" });
  expect(consultas("/progreso")).toBe(1);
  expect(consultas("/rachas")).toBe(1);
  expect(consultas("/resumen")).toBe(1);
  expect(api.partidas).toHaveLength(0);
});
test("INT-01: eliminar juego desde biblioteca no consulta progreso del eliminado y conserva otro juego", async () => {
  api.otros = [
    {
      ...juegoE2,
      _id: "3123456789abcdef01234567",
      nombre: "Otro juego",
      logros: [],
    },
  ];
  const user = userEvent.setup();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  montar("/");
  await user.click(
    (await screen.findAllByRole("button", { name: /Eliminar/ }))[0],
  );
  await screen.findByRole("heading", { name: "Otro juego" });
  await user.click(await screen.findByRole("link", { name: /Ver progreso/ }));
  await screen.findByRole("region", { name: "Progreso semanal" });
  expect(
    api.solicitudes.filter(
      (s) => s.ruta === `/api/videojuegos/${juegoE2._id}/progreso`,
    ),
  ).toHaveLength(0);
  expect(consultas("/rachas")).toBe(1);
});
