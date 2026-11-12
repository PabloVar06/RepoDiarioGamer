import { Partida } from "../modelos/Partida.model";
import { obtenerFechaLocal, zonaHoraria } from "./fechas";
import { calcularRachasGlobales } from "./rachas.calculos";

export async function obtenerRachas(instante: Date) {
  const fechaLocalActual = obtenerFechaLocal(instante);
  const partidas = await Partida.find({}).select("fecha").lean();
  const fechas = partidas.map((partida) => {
    if (
      !(partida.fecha instanceof Date) ||
      !Number.isFinite(partida.fecha.getTime())
    )
      throw new Error("Fecha de partida almacenada no interpretable");
    return partida.fecha.toISOString().slice(0, 10);
  });
  return {
    ambito: "global" as const,
    zonaHoraria,
    fechaLocalActual,
    ...calcularRachasGlobales(fechas, fechaLocalActual),
  };
}
