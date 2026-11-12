import { fechaCivilUTC } from "./fechas";

interface PartidaActividad {
  fecha: string;
  duracionMinutos: number;
}
interface Actividad {
  minutosSemana: number;
  diasJugados: number;
}
interface Objetivos {
  minutosObjetivo: number;
  diasPorSemana: number;
}
interface Hito {
  _id: string;
  descripcion: string;
  porcentajeObjetivo: number;
}

export function calcularActividadSemanal(
  partidas: readonly PartidaActividad[],
  semana: { inicio: string; fin: string },
  hoy: string,
) {
  fechaCivilUTC(semana.inicio);
  fechaCivilUTC(semana.fin);
  fechaCivilUTC(hoy);
  const dias = new Set<string>();
  let minutosSemana = 0;
  for (const partida of partidas) {
    fechaCivilUTC(partida.fecha);
    if (
      !Number.isFinite(partida.duracionMinutos) ||
      partida.duracionMinutos < 1 ||
      partida.duracionMinutos > 1440
    ) {
      throw new Error("Duración de partida no interpretable");
    }
    if (
      partida.fecha >= semana.inicio &&
      partida.fecha <= semana.fin &&
      partida.fecha <= hoy
    ) {
      minutosSemana += partida.duracionMinutos;
      dias.add(partida.fecha);
    }
  }
  return {
    minutosSemana,
    horasSemana: minutosSemana / 60,
    diasJugados: dias.size,
  };
}

export function calcularCumplimiento(
  actividad: Actividad,
  meta: Objetivos | null,
) {
  if (!meta) return { porcentajeHoras: null, metaCumplida: null };
  if (
    !Number.isInteger(meta.minutosObjetivo) ||
    meta.minutosObjetivo < 1 ||
    meta.minutosObjetivo > 6000 ||
    !Number.isInteger(meta.diasPorSemana) ||
    meta.diasPorSemana < 1 ||
    meta.diasPorSemana > 7
  ) {
    throw new Error("Objetivos de meta no interpretables");
  }
  return {
    porcentajeHoras: (actividad.minutosSemana / meta.minutosObjetivo) * 100,
    metaCumplida:
      actividad.minutosSemana >= meta.minutosObjetivo &&
      actividad.diasJugados >= meta.diasPorSemana,
  };
}

export function calcularAvanceMaximo(
  partidas: readonly { porcentajeAvance: number }[],
) {
  let maximo = 0;
  for (const partida of partidas) {
    if (
      !Number.isFinite(partida.porcentajeAvance) ||
      partida.porcentajeAvance < 0 ||
      partida.porcentajeAvance > 100
    ) {
      throw new Error("Avance de partida no interpretable");
    }
    maximo = Math.max(maximo, partida.porcentajeAvance);
  }
  return maximo;
}

export function evaluarHitos(hitos: readonly Hito[], maximo: number) {
  return hitos.map((hito) => {
    if (
      !Number.isInteger(hito.porcentajeObjetivo) ||
      hito.porcentajeObjetivo < 1 ||
      hito.porcentajeObjetivo > 100
    ) {
      throw new Error("Objetivo de hito no interpretable");
    }
    return { ...hito, alcanzado: maximo >= hito.porcentajeObjetivo };
  });
}
