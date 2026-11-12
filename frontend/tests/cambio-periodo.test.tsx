import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { proximoCambioGuayaquil } from "../src/hooks/useActualizacionPeriodo";
import { useIndicadoresVideojuego } from "../src/hooks/useProgresoVideojuego";
import { metasApi } from "../src/api/metasApi";
import { juegoE2, pendiente, progresoE2, rachasE2 } from "./fixtures/e2";
import type { ProgresoJuegoDTO } from "../src/tipos";

vi.mock("../src/api/metasApi", () => ({
  metasApi: { progreso: vi.fn(), rachas: vi.fn() },
}));
let visible: DocumentVisibilityState;
let dia: string;
beforeEach(() => {
  vi.useRealTimers();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-16T04:59:59.000Z"));
  visible = "visible";
  dia = "2026-11-15";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(
    () => visible,
  );
  vi.mocked(metasApi.progreso)
    .mockReset()
    .mockImplementation(async (id) =>
      progresoE2({
        videojuego: id,
        fechaLocalActual: dia,
        semana:
          dia === "2026-11-15"
            ? { inicio: "2026-11-09", fin: "2026-11-15" }
            : { inicio: "2026-11-16", fin: "2026-11-22" },
      }),
    );
  vi.mocked(metasApi.rachas)
    .mockReset()
    .mockImplementation(async () => ({
      ...rachasE2(),
      fechaLocalActual: dia,
      rachaActual: dia === "2026-11-15" ? 1 : 0,
    }));
});
afterEach(() => vi.useRealTimers());
async function montar() {
  const vista = renderHook(() => useIndicadoresVideojuego(juegoE2._id));
  await act(async () => {
    await Promise.resolve();
  });
  return vista;
}
async function eventos() {
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
  });
}

test("INT-03: medianoche Guayaquil reconsulta una vez y cambia semana/racha", async () => {
  const { result } = await montar();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(999);
  });
  expect(metasApi.progreso).toHaveBeenCalledTimes(1);
  dia = "2026-11-16";
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
  expect(metasApi.rachas).toHaveBeenCalledTimes(2);
  expect(result.current.progreso.datos?.semana.inicio).toBe("2026-11-16");
  expect(result.current.rachas.datos?.rachaActual).toBe(0);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
});
test("INT-03: foco y visibilidad simultáneos producen una sola pareja de GET", async () => {
  await montar();
  await eventos();
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
  expect(metasApi.rachas).toHaveBeenCalledTimes(2);
});
test("INT-03: pestaña oculta suspende timer y al volver cubre el día omitido", async () => {
  const { result } = await montar();
  visible = "hidden";
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(metasApi.progreso).toHaveBeenCalledTimes(1);
  visible = "visible";
  dia = "2026-11-16";
  await eventos();
  expect(result.current.progreso.datos?.fechaLocalActual).toBe(dia);
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
});
test("INT-03: error al cambio de día no provoca polling ni ceros inventados; foco recupera", async () => {
  const { result } = await montar();
  vi.mocked(metasApi.progreso).mockRejectedValueOnce(
    new Error("Fallo de lectura"),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(result.current.progreso.error).toBe("Fallo de lectura");
  expect(result.current.progreso.datos).toBeNull();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
  dia = "2026-11-16";
  await eventos();
  expect(result.current.progreso.datos?.fechaLocalActual).toBe(dia);
});
test("INT-03: respuesta con el mismo día vencido no entra en bucle", async () => {
  await montar();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(metasApi.progreso).toHaveBeenCalledTimes(2);
});
test("INT-03: StrictMode limpia timers/listeners y desmontar impide nuevas consultas", async () => {
  const vista = renderHook(() => useIndicadoresVideojuego(juegoE2._id), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    ),
  });
  await act(async () => {
    await Promise.resolve();
  });
  await eventos();
  expect(metasApi.progreso).toHaveBeenCalledTimes(3);
  vista.unmount();
  const antes = vi.mocked(metasApi.progreso).mock.calls.length;
  await eventos();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(86_400_000);
  });
  expect(metasApi.progreso).toHaveBeenCalledTimes(antes);
  expect(vi.getTimerCount()).toBe(0);
});
test("INT-03: ruta nueva cancela petición y timer del juego anterior", async () => {
  const p = pendiente<ProgresoJuegoDTO>();
  vi.mocked(metasApi.progreso).mockReturnValueOnce(p.promesa);
  const otro = "3123456789abcdef01234567";
  const vista = renderHook(({ id }) => useIndicadoresVideojuego(id), {
    initialProps: { id: juegoE2._id },
  });
  vista.rerender({ id: otro });
  await act(async () => {
    p.resolver(progresoE2());
  });
  expect(vista.result.current.progreso.datos?.videojuego).toBe(otro);
  dia = "2026-11-16";
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(
    vi.mocked(metasApi.progreso).mock.calls[
      vi.mocked(metasApi.progreso).mock.calls.length - 1
    ]?.[0],
  ).toBe(otro);
});

test.each([
  ["2026-11-30", "2026-12-01T05:00:00.000Z"],
  ["2026-12-31", "2027-01-01T05:00:00.000Z"],
  ["2024-02-28", "2024-02-29T05:00:00.000Z"],
  ["2026-02-28", "2026-03-01T05:00:00.000Z"],
])(
  "INT-03: siguiente corte de %s cruza calendario correctamente",
  (dia, esperado) => {
    expect(new Date(proximoCambioGuayaquil(dia)).toISOString()).toBe(esperado);
  },
);
test("INT-03: fechas inválidas no producen un timeout NaN", () => {
  for (const valor of ["0000-01-01", "2026-02-30"])
    expect(() => proximoCambioGuayaquil(valor)).toThrow();
});
