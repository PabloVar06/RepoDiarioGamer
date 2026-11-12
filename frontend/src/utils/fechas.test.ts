import { afterEach, expect, test } from "vitest";
import { formatearFechaCivil, hoyGuayaquil } from "./fechas";

const zonaOriginal = process.env.TZ;
afterEach(() => {
  if (zonaOriginal === undefined) delete process.env.TZ;
  else process.env.TZ = zonaOriginal;
});

test.each(["UTC", "America/Guayaquil", "Asia/Tokyo", "America/Los_Angeles"])(
  "hoy de Guayaquil y día almacenado no dependen de TZ %s",
  (zona) => {
    process.env.TZ = zona;
    expect(hoyGuayaquil(new Date("2026-11-16T04:59:59.999Z"))).toBe(
      "2026-11-15",
    );
    expect(hoyGuayaquil(new Date("2026-11-16T05:00:00.000Z"))).toBe(
      "2026-11-16",
    );
    expect(formatearFechaCivil("2026-11-15T00:00:00.000Z")).toBe("15/11/2026");
    expect(formatearFechaCivil("2026-11-16T02:30:00.000Z")).toBe("16/11/2026");
  },
);

test.each([
  ["2026-11-15", "15/11/2026"],
  ["2026-11-15T00:00:00.000Z", "15/11/2026"],
  ["2026-11-15T23:30:00.000Z", "15/11/2026"],
  ["2024-02-29T00:00:00.000Z", "29/02/2024"],
  ["0001-01-01T00:00:00.000Z", "01/01/0001"],
  ["0099-12-31T00:00:00.000Z", "31/12/0099"],
  ["9999-12-31T00:00:00.000Z", "31/12/9999"],
])("presenta %s como %s sin pedir hora", (fecha, visible) => {
  expect(formatearFechaCivil(fecha)).toBe(visible);
});

test.each([
  null,
  undefined,
  "",
  0,
  {},
  "no-es-fecha",
  "2026-02-30",
  "2025-02-29T00:00:00.000Z",
  "0000-01-01T00:00:00.000Z",
  "2026-11-15T99:00:00Z",
  "2026-11-15T24:00:00.000Z",
  "2026-11-15T23:30:00-05:00",
])("dato inválido %j no se convierte en una fecha inventada", (valor) => {
  expect(formatearFechaCivil(valor)).toBe("Fecha no disponible");
});

test("hoy rechaza un reloj inválido sin modificar el instante recibido", () => {
  expect(() => hoyGuayaquil(new Date(NaN))).toThrow();
  const instante = new Date("2027-01-01T04:59:59.999Z");
  expect(hoyGuayaquil(instante)).toBe("2026-12-31");
  expect(instante.toISOString()).toBe("2027-01-01T04:59:59.999Z");
});
