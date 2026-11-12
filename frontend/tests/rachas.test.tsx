import { beforeEach, expect, test, vi } from "vitest";
import { StrictMode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { metasApi } from "../src/api/metasApi";
import { videojuegosApi } from "../src/api/videojuegosApi";
import { partidasApi } from "../src/api/partidasApi";
import { juegoE2, pendiente, progresoE2 } from "./fixtures/e2";
import type { RachasDTO } from "../src/tipos";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
vi.mock("../src/api/metasApi", async (original) => ({
  ...(await original<typeof import("../src/api/metasApi")>()),
  metasApi: { progreso: vi.fn(), rachas: vi.fn() },
}));
vi.mock("../src/api/videojuegosApi", () => ({
  videojuegosApi: { obtener: vi.fn(), partidas: vi.fn(), resumen: vi.fn() },
}));
vi.mock("../src/api/partidasApi", () => ({
  partidasApi: { eliminar: vi.fn() },
}));
const dto = (cambios: Partial<RachasDTO> = {}): RachasDTO => ({
  ambito: "global",
  zonaHoraria: "America/Guayaquil",
  fechaLocalActual: "2026-11-15",
  rachaActual: 1,
  mejorRacha: 5,
  ...cambios,
});
function abrir() {
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  return render(<App />, { container: document.getElementById("root")! });
}
beforeEach(() => {
  vi.mocked(videojuegosApi.obtener).mockResolvedValue(juegoE2);
  vi.mocked(videojuegosApi.partidas).mockResolvedValue([]);
  vi.mocked(videojuegosApi.resumen).mockResolvedValue({
    totalPartidas: 0,
    horasTotales: 0,
    ultimaPartida: null,
    porcentajeAvanceActual: 0,
  });
  vi.mocked(metasApi.progreso).mockReset().mockResolvedValue(progresoE2());
  vi.mocked(metasApi.rachas).mockReset().mockResolvedValue(dto());
});
test("FE-02: AC04/11 muestra dos rachas globales sin meta, distintas de días semanales", async () => {
  abrir();
  const panel = await screen.findByRole("region", { name: "Rachas globales" });
  expect(within(panel).getByText("Racha actual")).toBeInTheDocument();
  expect(within(panel).getByText("Mejor racha histórica")).toBeInTheDocument();
  expect(within(panel).getByText("1 día")).toBeInTheDocument();
  expect(within(panel).getByText("5 días")).toBeInTheDocument();
  expect(within(panel).getByText(/Todos tus videojuegos/)).toBeInTheDocument();
  expect(screen.getByText("1 día jugado")).toBeInTheDocument();
});
test("FE-02: ambos ceros reales se muestran aun sin partidas", async () => {
  vi.mocked(metasApi.rachas).mockResolvedValue(
    dto({ rachaActual: 0, mejorRacha: 0 }),
  );
  abrir();
  const panel = await screen.findByRole("region", { name: "Rachas globales" });
  expect(within(panel).getAllByText("0 días")).toHaveLength(2);
});

test("FE-02: fixture dirigido AC04 presenta A=90 minutos/un día y ambas rachas globales=1", async () => {
  vi.mocked(metasApi.rachas).mockResolvedValue(
    dto({ rachaActual: 1, mejorRacha: 1 }),
  );
  abrir();
  const panel = await screen.findByRole("region", { name: "Rachas globales" });
  expect(within(panel).getAllByText("1 día")).toHaveLength(2);
  expect(screen.getByText("90 minutos")).toBeInTheDocument();
  expect(screen.getByText("1,5 h")).toBeInTheDocument();
  expect(screen.getByText("1 día jugado")).toBeInTheDocument();
});
test("FE-02: fallo de rachas no oculta E1 ni actividad; reintento consulta solo rachas", async () => {
  vi.mocked(metasApi.rachas).mockRejectedValueOnce(
    new Error("No pudimos consultar las rachas"),
  );
  const user = userEvent.setup();
  abrir();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No pudimos consultar las rachas",
  );
  expect(screen.getByText("1,5 h")).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Resumen acumulado E1" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reintentar rachas" }));
  await screen.findByText("5 días");
  expect(metasApi.rachas).toHaveBeenCalledTimes(2);
  expect(metasApi.progreso).toHaveBeenCalledTimes(1);
});
test("FE-02: carga de rachas no inventa ceros y se cancela al desmontar", async () => {
  const consulta = pendiente<RachasDTO>();
  vi.mocked(metasApi.rachas).mockReturnValueOnce(consulta.promesa);
  const vista = abrir();
  expect(await screen.findByText("Cargando rachas globales…")).toHaveAttribute(
    "role",
    "status",
  );
  expect(screen.queryByText("0 días")).not.toBeInTheDocument();
  const signal = vi.mocked(metasApi.rachas).mock.calls[0][0];
  vista.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    consulta.resolver(dto());
  });
});
test("FE-02: fechas de respuesta distintas reconsultan ambos bloques una vez", async () => {
  vi.mocked(metasApi.progreso).mockResolvedValueOnce(
    progresoE2({ fechaLocalActual: "2026-11-14" }),
  );
  abrir();
  await waitFor(() => expect(metasApi.progreso).toHaveBeenCalledTimes(2));
  await screen.findByText("5 días");
  expect(metasApi.rachas).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
test("FE-02: desfase persistente no muestra datos mezclados ni genera bucle; reintento manual recupera", async () => {
  vi.mocked(metasApi.rachas).mockResolvedValue(
    dto({ fechaLocalActual: "2026-11-14" }),
  );
  const user = userEvent.setup();
  abrir();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /fechas distintas/,
  );
  expect(metasApi.rachas).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("5 días")).not.toBeInTheDocument();
  expect(screen.queryByText("1,5 h")).not.toBeInTheDocument();
  vi.mocked(metasApi.rachas).mockResolvedValue(dto());
  await user.click(
    screen.getByRole("button", { name: "Reintentar indicadores" }),
  );
  expect(await screen.findByText("5 días")).toBeInTheDocument();
});
test("FE-02/INT-01: borrar partida reconsulta rachas junto con progreso y resumen E1", async () => {
  vi.mocked(videojuegosApi.partidas).mockResolvedValueOnce([
    {
      _id: "2123456789abcdef01234567",
      videojuego: juegoE2._id,
      fecha: "2026-11-11T00:00:00.000Z",
      duracionMinutos: 30,
      porcentajeAvance: 20,
    },
  ]);
  vi.mocked(partidasApi.eliminar).mockResolvedValue(undefined);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const user = userEvent.setup();
  abrir();
  await screen.findByText("5 días");
  await user.click(screen.getByRole("button", { name: "Eliminar partida" }));
  await waitFor(() => expect(metasApi.rachas).toHaveBeenCalledTimes(2));
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
  expect(videojuegosApi.resumen).toHaveBeenCalledTimes(2);
});

test("FE-02: StrictMode descarta las consultas canceladas y conserva ambos indicadores", async () => {
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  render(
    <StrictMode>
      <App />
    </StrictMode>,
    { container: document.getElementById("root")! },
  );
  await screen.findByText("5 días");
  expect(screen.getByText("1,5 h")).toBeInTheDocument();
  expect(vi.mocked(metasApi.rachas).mock.calls[0][0]?.aborted).toBe(true);
  expect(vi.mocked(metasApi.progreso).mock.calls[0][1]?.aborted).toBe(true);
});
