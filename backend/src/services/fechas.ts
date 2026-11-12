export const zonaHoraria = "America/Guayaquil";

export function fechaCivilUTC(dia: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia.startsWith("0000")) {
    throw new Error("Fecha civil no interpretable");
  }
  const fecha = new Date(`${dia}T00:00:00.000Z`);
  if (
    !Number.isFinite(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== dia
  ) {
    throw new Error("Fecha civil no interpretable");
  }
  return fecha;
}

export function obtenerFechaLocal(instante: Date): string {
  if (!Number.isFinite(instante.getTime()))
    throw new Error("Instante no interpretable");
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zonaHoraria,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)!.value;
  const dia = `${valor("year").padStart(4, "0")}-${valor("month")}-${valor("day")}`;
  fechaCivilUTC(dia);
  return dia;
}

export function obtenerSemana(dia: string) {
  const inicio = fechaCivilUTC(dia);
  inicio.setUTCDate(inicio.getUTCDate() - ((inicio.getUTCDay() + 6) % 7));
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 6);
  return {
    inicio: inicio.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  };
}
