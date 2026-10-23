import { Schema, model } from "mongoose";

const PartidaSchema = new Schema({ videojuego: { type: Schema.Types.ObjectId, 
    ref: "Videojuego", required: true }, 
    fecha: { type: Date, required: true, set: (valor: unknown) => {
      // Guardar únicamente la fecha (UTC), sin hora de la sesión.
      if (valor == null || valor === "") return valor;
      if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return new Date(`${valor}T00:00:00.000Z`);
      }
      const fecha = new Date(valor as string | number | Date);
      if (Number.isNaN(fecha.getTime())) return valor; // Mongoose valida el dato inválido.
      return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    } }, 
    duracionMinutos: { type: Number, required: true, min: 1, max: 1440 }, 
    porcentajeAvance: { type: Number, required: true, min: 0, max: 100 }, 
    notas: { type: String, trim: true, maxlength: 1000 } }, 
    { timestamps: true, versionKey: false });
    
export const Partida = model("Partida", PartidaSchema);
