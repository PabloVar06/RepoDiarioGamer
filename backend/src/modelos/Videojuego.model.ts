import { Schema, model } from "mongoose";

const logro = new Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  obtenido: { type: Boolean, required: true, default: false }
});

const videojuego = new Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 120 },
  plataforma: { type: String, required: true, enum: ["PC", "PlayStation", "Xbox", "Switch", "Movil"] },
  genero: { type: String, required: true, enum: ["accion", "rol", "estrategia", "puzzle", "deportes", "otro"] },
  estado: { type: String, required: true, enum: ["jugando", "pausado", "completado", "abandonado"], default: "jugando" },
  logros: { type: [logro], default: [] }
}, { timestamps: true, versionKey: false });

export const Videojuego = model("Videojuego", videojuego);
