import { Schema, model } from "mongoose";
import { fechaCivilUTC } from "../services/fechas";

const PartidaSchema = new Schema(
  {
    videojuego: {
      type: Schema.Types.ObjectId,
      ref: "Videojuego",
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
      set: (valor: unknown) => {
        // La fecha civil se representa a medianoche UTC; no convertir instantes.
        if (valor == null || valor === "") return valor;
        if (typeof valor === "string") return fechaCivilUTC(valor);
        if (valor instanceof Date) {
          const fecha = fechaCivilUTC(valor.toISOString().slice(0, 10));
          if (fecha.getTime() === valor.getTime()) return fecha;
        }
        throw new Error("La fecha debe representar un día civil sin hora");
      },
    },
    duracionMinutos: { type: Number, required: true, min: 1, max: 1440 },
    porcentajeAvance: { type: Number, required: true, min: 0, max: 100 },
    notas: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, versionKey: false },
);

export const Partida = model("Partida", PartidaSchema);
