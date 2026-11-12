import { ApiError } from "../apiError";
import { Meta } from "../modelos/Meta.model";
import { Partida } from "../modelos/Partida.model";
import { obtenerVideojuego } from "./videojuegos.service";
import { metaDTO } from "./metas.service";
import { obtenerFechaLocal, obtenerSemana, zonaHoraria } from "./fechas";
import {
  calcularActividadSemanal,
  calcularAvanceMaximo,
  calcularCumplimiento,
  evaluarHitos,
} from "./progreso.calculos";

export async function obtenerProgreso(id: string, instante: Date) {
  if (!/^[a-f0-9]{24}$/i.test(id))
    throw new ApiError(400, "Id de videojuego mal formado");
  const juego = await obtenerVideojuego(id);
  const fechaLocalActual = obtenerFechaLocal(instante);
  const semana = obtenerSemana(fechaLocalActual);
  const [activa, documentos] = await Promise.all([
    Meta.findOne({ videojuego: juego._id, activa: true }),
    Partida.find({ videojuego: juego._id })
      .select("fecha duracionMinutos porcentajeAvance")
      .lean(),
  ]);
  const partidas = documentos.map((partida) => {
    if (
      !(partida.fecha instanceof Date) ||
      !Number.isFinite(partida.fecha.getTime())
    ) {
      throw new Error("Fecha de partida almacenada no interpretable");
    }
    // P07: el día UTC guardado es civil; no convertir medianoche a Guayaquil.
    return {
      fecha: partida.fecha.toISOString().slice(0, 10),
      duracionMinutos: partida.duracionMinutos,
      porcentajeAvance: partida.porcentajeAvance,
    };
  });
  const actividad = calcularActividadSemanal(
    partidas,
    semana,
    fechaLocalActual,
  );
  const porcentajeAvanceActual = calcularAvanceMaximo(partidas);
  const meta = activa ? metaDTO(activa) : null;
  return {
    videojuego: juego._id.toHexString(),
    zonaHoraria,
    fechaLocalActual,
    semana,
    ...actividad,
    porcentajeAvanceActual,
    meta,
    ...calcularCumplimiento(actividad, meta),
    hitos: evaluarHitos(meta?.hitos ?? [], porcentajeAvanceActual),
  };
}
