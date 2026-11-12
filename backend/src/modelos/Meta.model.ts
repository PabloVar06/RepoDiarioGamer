import { Schema, model } from "mongoose";

const hito = new Schema({
  descripcion: { type: String, required: true, trim: true, maxlength: 120 },
  porcentajeObjetivo: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    validate: Number.isInteger,
  },
});

const meta = new Schema(
  {
    videojuego: {
      type: Schema.Types.ObjectId,
      ref: "Videojuego",
      required: true,
      immutable: true,
    },
    minutosObjetivo: {
      type: Number,
      required: true,
      min: 1,
      max: 6000,
      validate: Number.isInteger,
    },
    diasPorSemana: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
      validate: Number.isInteger,
    },
    activa: { type: Boolean, required: true, default: true },
    hitos: {
      type: [hito],
      default: [],
      validate: {
        validator: (value: unknown[]) =>
          Array.isArray(value) && value.length <= 5,
        message: "Una meta admite hasta cinco hitos",
      },
    },
  },
  { timestamps: true, versionKey: false },
);

meta.index(
  { videojuego: 1 },
  { unique: true, partialFilterExpression: { activa: true } },
);

export const Meta = model("Meta", meta);
