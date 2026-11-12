import { beforeEach, expect, test, vi } from "vitest";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useProgresoVideojuego } from "../src/hooks/useProgresoVideojuego";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { metasApi } from "../src/api/metasApi";
import { videojuegosApi } from "../src/api/videojuegosApi";
import { partidasApi } from "../src/api/partidasApi";
import type { ProgresoJuegoDTO } from "../src/tipos";
import {
  juegoE2,
  metaE2,
  pendiente,
  progresoE2,
  rachasE2,
} from "./fixtures/e2";

vi.mock("gsap", () => ({ default: { fromTo: vi.fn(), to: vi.fn() } }));
vi.mock("../src/api/metasApi", async (original) => ({
  ...(await original<typeof import("../src/api/metasApi")>()),
  metasApi: { progreso: vi.fn(), rachas: vi.fn(async () => rachasE2()) },
}));
vi.mock("../src/api/videojuegosApi", () => ({
  videojuegosApi: {
    obtener: vi.fn(),
    partidas: vi.fn(),
    resumen: vi.fn(),
    marcarLogro: vi.fn(),
  },
}));
vi.mock("../src/api/partidasApi", () => ({
  partidasApi: { eliminar: vi.fn() },
}));

function abrir() {
  window.history.replaceState({}, "", `/videojuegos/${juegoE2._id}`);
  return render(<App />, { container: document.getElementById("root")! });
}
beforeEach(() => {
  vi.mocked(videojuegosApi.obtener).mockResolvedValue(juegoE2);
  vi.mocked(videojuegosApi.partidas).mockResolvedValue([]);
  vi.mocked(videojuegosApi.resumen).mockResolvedValue({
    totalPartidas: 4,
    horasTotales: 20,
    ultimaPartida: null,
    porcentajeAvanceActual: 80,
  });
  vi.mocked(metasApi.progreso).mockReset().mockResolvedValue(progresoE2());
});

test("FE-01: carga independiente de progreso conserva el resumen E1 sin ceros inventados", async () => {
  const consulta = pendiente<ProgresoJuegoDTO>();
  vi.mocked(metasApi.progreso).mockReturnValueOnce(consulta.promesa);
  abrir();
  expect(await screen.findByText("20")).toBeInTheDocument();
  expect(screen.getByText("Cargando progreso semanal…")).toHaveAttribute(
    "role",
    "status",
  );
  expect(screen.queryByText("Sin meta activa")).not.toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  await act(async () => {
    consulta.resolver(progresoE2());
  });
  expect(await screen.findByText("Sin meta activa")).toBeInTheDocument();
});

test("FE-01: AC04/11 muestra 1,5 horas, 90 minutos, un día y avance sin meta", async () => {
  abrir();
  const panel = await screen.findByRole("region", { name: "Progreso semanal" });
  expect(within(panel).getByText("1,5 h")).toBeInTheDocument();
  expect(within(panel).getByText("90 minutos")).toBeInTheDocument();
  expect(within(panel).getByText("1 día jugado")).toBeInTheDocument();
  expect(within(panel).getByText("30 %")).toBeInTheDocument();
  expect(within(panel).getByText(/Crea una meta/)).toBeInTheDocument();
  expect(within(panel).queryByRole("progressbar")).not.toBeInTheDocument();
  expect(
    within(panel).getByRole("button", { name: "Crear meta" }),
  ).toBeInTheDocument();
  expect(screen.getByText("80%")).toBeInTheDocument();
});

test("FE-01: vacío real conserva ceros y no los confunde con error", async () => {
  vi.mocked(metasApi.progreso).mockResolvedValue(
    progresoE2({
      minutosSemana: 0,
      horasSemana: 0,
      diasJugados: 0,
      porcentajeAvanceActual: 0,
    }),
  );
  abrir();
  const panel = await screen.findByRole("region", { name: "Progreso semanal" });
  expect(within(panel).getByText("0 h")).toBeInTheDocument();
  expect(within(panel).getByText("0 días jugados")).toBeInTheDocument();
  expect(
    within(panel).getByText("Todavía no hay partidas esta semana."),
  ).toBeInTheDocument();
  expect(within(panel).queryByRole("alert")).not.toBeInTheDocument();
});

test("FE-01: fallo parcial permite reintentar GET sin ocultar E1", async () => {
  vi.mocked(metasApi.progreso).mockRejectedValueOnce(
    new Error("No pudimos consultar el progreso"),
  );
  const user = userEvent.setup();
  abrir();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No pudimos consultar el progreso",
  );
  expect(
    screen.getByRole("heading", { name: juegoE2.nombre }),
  ).toBeInTheDocument();
  expect(screen.getByText("20")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reintentar progreso" }));
  expect(await screen.findByText("Sin meta activa")).toBeInTheDocument();
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
  expect(videojuegosApi.resumen).toHaveBeenCalledTimes(1);
});

test.each([
  [140, false, "140 %", 100],
  [99.9999, false, "<100 %", 99.9999],
  [100.0001, true, ">100 %", 100],
  [100, true, "100 %", 100],
])(
  "FE-01: porcentaje %s conserva texto preciso y cumplimiento conjunto",
  async (porcentajeHoras, metaCumplida, texto, barra) => {
    vi.mocked(metasApi.progreso).mockResolvedValue(
      progresoE2({
        meta: metaE2,
        porcentajeHoras,
        metaCumplida,
        minutosSemana: porcentajeHoras * 3,
        horasSemana: porcentajeHoras / 20,
        diasJugados: metaCumplida ? 3 : 2,
      }),
    );
    abrir();
    expect(
      await screen.findByRole("progressbar", { name: "Cumplimiento de horas" }),
    ).toHaveAttribute("aria-valuenow", String(barra));
    expect(screen.getByText(texto)).toBeInTheDocument();
    expect(
      screen.getByText(
        metaCumplida
          ? "Meta semanal cumplida"
          : "Meta semanal pendiente: requiere horas y días",
      ),
    ).toBeInTheDocument();
  },
);

test("FE-01/INT-01: eliminar partida reconsulta historial, resumen y progreso", async () => {
  vi.mocked(videojuegosApi.partidas).mockResolvedValueOnce([
    {
      _id: "2123456789abcdef01234567",
      videojuego: juegoE2._id,
      fecha: "2026-11-09T00:00:00.000Z",
      duracionMinutos: 90,
      porcentajeAvance: 30,
    },
  ]);
  vi.mocked(partidasApi.eliminar).mockResolvedValue(undefined);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const user = userEvent.setup();
  abrir();
  await screen.findByText("Sin meta activa");
  await user.click(screen.getByRole("button", { name: "Eliminar partida" }));
  await waitFor(() => expect(metasApi.progreso).toHaveBeenCalledTimes(2));
  expect(videojuegosApi.resumen).toHaveBeenCalledTimes(2);
  expect(videojuegosApi.partidas).toHaveBeenCalledTimes(2);
  expect(
    screen.queryByRole("button", { name: "Eliminar partida" }),
  ).not.toBeInTheDocument();
});

test("FE-01: juego inexistente no ofrece crear meta y permite volver", async () => {
  vi.mocked(videojuegosApi.obtener).mockRejectedValue(
    new Error("Videojuego no encontrado"),
  );
  abrir();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Videojuego no encontrado",
  );
  expect(
    screen.getByRole("link", { name: /Volver a la biblioteca/ }),
  ).toHaveAttribute("href", "/");
  expect(screen.queryByText("Sin meta activa")).not.toBeInTheDocument();
});

test("FE-01: cambio de juego cancela e ignora una respuesta anterior tardía", async () => {
  const anterior = pendiente<ProgresoJuegoDTO>();
  const otro = "3123456789abcdef01234567";
  vi.mocked(metasApi.progreso)
    .mockReturnValueOnce(anterior.promesa)
    .mockResolvedValueOnce(progresoE2({ videojuego: otro }));
  const { result, rerender } = renderHook(
    ({ id }) => useProgresoVideojuego(id),
    { initialProps: { id: juegoE2._id } },
  );
  const signal = vi.mocked(metasApi.progreso).mock.calls[0][1];
  rerender({ id: otro });
  await waitFor(() => expect(result.current.datos?.videojuego).toBe(otro));
  await act(async () => {
    anterior.resolver(progresoE2());
  });
  expect(signal?.aborted).toBe(true);
  expect(result.current.datos?.videojuego).toBe(otro);
});

test("FE-01: reconsulta más reciente prevalece aunque la anterior ignore abort", async () => {
  const anterior = pendiente<ProgresoJuegoDTO>();
  vi.mocked(metasApi.progreso)
    .mockReturnValueOnce(anterior.promesa)
    .mockResolvedValueOnce(progresoE2({ minutosSemana: 120, horasSemana: 2 }));
  const { result, unmount } = renderHook(() =>
    useProgresoVideojuego(juegoE2._id),
  );
  await act(async () => {
    await result.current.recargar();
  });
  await act(async () => {
    anterior.resolver(progresoE2());
  });
  expect(result.current.datos?.minutosSemana).toBe(120);
  const signal = vi.mocked(metasApi.progreso).mock.calls[1][1];
  unmount();
  expect(signal?.aborted).toBe(true);
});

test("FE-01: logros manuales E1 siguen marcándose sin alterar el progreso", async () => {
  vi.mocked(videojuegosApi.obtener)
    .mockResolvedValueOnce({
      ...juegoE2,
      logros: [{ _id: metaE2._id, nombre: "Logro manual", obtenido: false }],
    })
    .mockResolvedValue({
      ...juegoE2,
      logros: [{ _id: metaE2._id, nombre: "Logro manual", obtenido: true }],
    });
  vi.mocked(videojuegosApi.marcarLogro).mockResolvedValue(juegoE2);
  const user = userEvent.setup();
  abrir();
  await user.click(
    await screen.findByRole("checkbox", { name: "Logro manual" }),
  );
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
  expect(videojuegosApi.marcarLogro).toHaveBeenCalledWith(
    juegoE2._id,
    metaE2._id,
    true,
  );
});
