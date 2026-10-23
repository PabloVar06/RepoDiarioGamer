import { Schema, model } from "mongoose";

const logro = new Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  obtenido: { type: Boolean, required: true, default: false }
});

const videojuego = new Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 120 },
  plataforma: { type: String, required: true, enum: ["PC", "PlayStation", "Xbox", "Switch", "Movil"] },
  genero: { type: String, required: true, enum: ["Accion", "Rol", "Estrategia", "Puzzle", "Deportes", "Terror", "Otro"] },
  estado: { type: String, required: true, enum: ["Jugando", "Pausado", "Completado", "Abandonado"], default: "Jugando" },
  logros: { type: [logro], default: [] }
}, { timestamps: true, versionKey: false });

export const Videojuego = model("Videojuego", videojuego);
