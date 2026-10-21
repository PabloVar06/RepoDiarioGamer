import { Schema, model } from "mongoose";

const PartidaSchema = new Schema({ videojuego: { type: Schema.Types.ObjectId, 
    ref: "Videojuego", required: true }, 
    fecha: { type: Date, required: true }, 
    duracionMinutos: { type: Number, required: true, min: 1, max: 1440 }, 
    porcentajeAvance: { type: Number, required: true, min: 0, max: 100 }, 
    notas: { type: String, trim: true, maxlength: 1000 } }, 
    { timestamps: true, versionKey: false });
    
export const Partida = model("Partida", PartidaSchema);
