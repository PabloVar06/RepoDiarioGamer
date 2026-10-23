import { Types } from "mongoose";
import { Videojuego } from "../modelos/Videojuego.model";
import { Partida } from "../modelos/Partida.model";
import { ApiError } from "../apiError";

export const listarVideojuegos = (filtro?: string) => {
  const nombreSeguro = filtro?.replace(/[.*+?^${}()|[\]\\]/g, "\$&");
  return Videojuego.find(nombreSeguro ? { nombre: { $regex: nombreSeguro, $options: "i" } } : {}).sort({ updatedAt: -1 });
};
export async function obtenerVideojuego(id: string) {
  const juego = await Videojuego.findById(id);
  if (!juego) throw new ApiError(404, "Videojuego no encontrado");
  return juego;
}
export const crearVideojuego = (datos: unknown) => Videojuego.create(datos);
export async function actualizarVideojuego(id: string, datos: Record<string, unknown>) {
  const juego = await Videojuego.findById(id);
  if (!juego) throw new ApiError(404, "Videojuego no encontrado");
  for (const campo of ["nombre", "plataforma", "genero", "estado", "logros"] as const) {
    if (Object.prototype.hasOwnProperty.call(datos, campo)) juego.set(campo, datos[campo]);
  }
  return juego.save();
}
export async function eliminarVideojuego(id: string) {
  const juego = await obtenerVideojuego(id);
  await Partida.deleteMany({ videojuego: juego._id });
  await juego.deleteOne();
}
export async function listarPartidasVideojuego(id: string) {
  await obtenerVideojuego(id);
  return Partida.find({ videojuego: id }).sort({ fecha: -1, _id: -1 });
}
export async function marcarLogro(id: string, logroId: string, obtenido: unknown) {
  const juego = await obtenerVideojuego(id);
  if (!Types.ObjectId.isValid(logroId)) throw new ApiError(400, "Id de logro mal formado");
  if (typeof obtenido !== "boolean") throw new ApiError(400, "obtenido debe ser booleano");
  const logro = juego.logros.id(logroId);
  if (!logro) throw new ApiError(404, "Logro no encontrado");
  logro.set("obtenido", obtenido);
  return juego.save();
}
export async function calcularResumen(id: string) {
  await obtenerVideojuego(id);
  const partidas = await Partida.find({ videojuego: id }).sort({ fecha: -1, _id: -1 });
  const minutos = partidas.reduce((total, partida) => total + partida.duracionMinutos, 0);
  return {
    totalPartidas: partidas.length,
    horasTotales: Math.round((minutos / 60) * 100) / 100,
    ultimaPartida: partidas[0]?.fecha ?? null,
    porcentajeAvanceActual: partidas.reduce((maximo, partida) => Math.max(maximo, partida.porcentajeAvance), 0)
  };
}
