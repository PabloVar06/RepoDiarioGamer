import { Types } from "mongoose";
import { Partida } from "../modelos/Partida.model";
import { Videojuego } from "../modelos/Videojuego.model";
import { ApiError } from "../apiError";

export const listarPartidas = () => Partida.find().populate("videojuego").sort({ fecha: -1 });
export async function crearPartida(datos: Record<string, unknown>) {
  if (!datos || !datos.videojuego) throw new ApiError(400, "El videojuego es obligatorio");
  if (typeof datos.videojuego !== "string" || !Types.ObjectId.isValid(datos.videojuego)) throw new ApiError(400, "Id de videojuego mal formado");
  const juego = await Videojuego.findById(datos.videojuego);
  if (!juego) throw new ApiError(404, "El videojuego referenciado no existe");
  return Partida.create(datos);
}
export async function eliminarPartida(id: string) {
  const partida = await Partida.findByIdAndDelete(id);
  if (!partida) throw new ApiError(404, "Partida no encontrada");
}
