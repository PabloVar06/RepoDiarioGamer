import { fechaCivilUTC } from "./fechas";

export function calcularRachasGlobales(fechas: readonly string[], hoy: string) {
  const diaActual = fechaCivilUTC(hoy).getTime() / 86_400_000;
  const dias = [
    ...new Set(
      fechas.map((fecha) => fechaCivilUTC(fecha).getTime() / 86_400_000),
    ),
  ]
    .filter((dia) => dia <= diaActual)
    .sort((a, b) => a - b);
  let longitud = 0;
  let mejorRacha = 0;
  for (let i = 0; i < dias.length; i++) {
    longitud = i > 0 && dias[i] === dias[i - 1] + 1 ? longitud + 1 : 1;
    mejorRacha = Math.max(mejorRacha, longitud);
  }
  const ultimo = dias[dias.length - 1];
  return {
    rachaActual: ultimo !== undefined && ultimo >= diaActual - 1 ? longitud : 0,
    mejorRacha,
  };
}
