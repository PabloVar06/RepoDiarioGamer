import { Types } from "mongoose";
import { Partida } from "../modelos/Partida.model";
import { Videojuego } from "../modelos/Videojuego.model";
import { ApiError } from "../apiError";
import { fechaCivilUTC, obtenerFechaLocal } from "./fechas";

export const listarPartidas = () =>
  Partida.find().populate("videojuego").sort({ fecha: -1 });
export async function crearPartida(
  datos: Record<string, unknown>,
  instante: Date,
) {
  if (!datos || !datos.videojuego)
    throw new ApiError(400, "El videojuego es obligatorio");
  if (
    typeof datos.videojuego !== "string" ||
    !Types.ObjectId.isValid(datos.videojuego)
  )
    throw new ApiError(400, "Id de videojuego mal formado");
  const juego = await Videojuego.findById(datos.videojuego);
  if (!juego) throw new ApiError(404, "El videojuego referenciado no existe");
  const hoy = obtenerFechaLocal(instante);
  let fecha: Date;
  try {
    if (typeof datos.fecha !== "string")
      throw new Error("Tipo de fecha inválido");
    fecha = fechaCivilUTC(datos.fecha);
  } catch {
    throw new ApiError(
      400,
      "La fecha debe ser un día válido con formato YYYY-MM-DD (años 0001–9999)",
    );
  }
  if (datos.fecha > hoy) {
    throw new ApiError(
      400,
      "La fecha no puede ser futura respecto a hoy en America/Guayaquil",
    );
  }
  return Partida.create({ ...datos, fecha });
}
export async function eliminarPartida(id: string) {
  const partida = await Partida.findByIdAndDelete(id);
  if (!partida) throw new ApiError(404, "Partida no encontrada");
}
