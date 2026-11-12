import { Types } from "mongoose";
import { Meta } from "../modelos/Meta.model";
import { ApiError } from "../apiError";
import { obtenerVideojuego } from "./videojuegos.service";

interface HitoEntrada {
  _id?: string;
  descripcion: string;
  porcentajeObjetivo: number;
}

function objeto(valor: unknown): Record<string, unknown> {
  if (valor === null || typeof valor !== "object" || Array.isArray(valor)) {
    throw new ApiError(400, "El cuerpo y cada hito deben ser objetos");
  }
  return valor as Record<string, unknown>;
}

function campos(datos: Record<string, unknown>, permitidos: string[]) {
  if (Object.keys(datos).some((campo) => !permitidos.includes(campo))) {
    throw new ApiError(400, "Hay campos no permitidos");
  }
}

function idValido(valor: unknown): string {
  if (typeof valor !== "string" || !/^[a-f0-9]{24}$/i.test(valor)) {
    throw new ApiError(400, "Id mal formado");
  }
  return new Types.ObjectId(valor).toHexString();
}

function entero(valor: unknown, maximo: number, nombre: string): number {
  if (
    typeof valor !== "number" ||
    !Number.isInteger(valor) ||
    valor < 1 ||
    valor > maximo
  ) {
    throw new ApiError(400, `${nombre} debe ser un entero entre 1 y ${maximo}`);
  }
  return valor;
}

function validarHitos(
  valor: unknown,
  idsExistentes?: ReadonlySet<string>,
): HitoEntrada[] {
  if (!Array.isArray(valor) || valor.length > 5) {
    throw new ApiError(
      400,
      "hitos debe ser un arreglo de hasta cinco elementos",
    );
  }
  const usados = new Set<string>();
  return valor.map((entrada) => {
    const dato = objeto(entrada);
    campos(
      dato,
      idsExistentes
        ? ["_id", "descripcion", "porcentajeObjetivo"]
        : ["descripcion", "porcentajeObjetivo"],
    );
    if (
      typeof dato.descripcion !== "string" ||
      !dato.descripcion.trim() ||
      dato.descripcion.trim().length > 120
    ) {
      throw new ApiError(
        400,
        "La descripción del hito debe tener entre 1 y 120 caracteres",
      );
    }
    const hito: HitoEntrada = {
      descripcion: dato.descripcion.trim(),
      porcentajeObjetivo: entero(
        dato.porcentajeObjetivo,
        100,
        "porcentajeObjetivo",
      ),
    };
    if (Object.prototype.hasOwnProperty.call(dato, "_id")) {
      const id = idValido(dato._id);
      if (!idsExistentes?.has(id) || usados.has(id)) {
        throw new ApiError(400, "El ID de hito es ajeno o está repetido");
      }
      usados.add(id);
      hito._id = id;
    }
    return hito;
  });
}

export function validarCrearMeta(valor: unknown) {
  const datos = objeto(valor);
  campos(datos, ["videojuego", "minutosObjetivo", "diasPorSemana", "hitos"]);
  return {
    videojuego: idValido(datos.videojuego),
    minutosObjetivo: entero(datos.minutosObjetivo, 6000, "minutosObjetivo"),
    diasPorSemana: entero(datos.diasPorSemana, 7, "diasPorSemana"),
    hitos: Object.prototype.hasOwnProperty.call(datos, "hitos")
      ? validarHitos(datos.hitos)
      : [],
  };
}

export function validarEditarMeta(
  valor: unknown,
  idsExistentes: ReadonlySet<string>,
) {
  const datos = objeto(valor);
  campos(datos, ["minutosObjetivo", "diasPorSemana", "hitos"]);
  return {
    minutosObjetivo: entero(datos.minutosObjetivo, 6000, "minutosObjetivo"),
    diasPorSemana: entero(datos.diasPorSemana, 7, "diasPorSemana"),
    hitos: Object.prototype.hasOwnProperty.call(datos, "hitos")
      ? validarHitos(datos.hitos, idsExistentes)
      : undefined,
  };
}

async function verificarIndiceMetas() {
  const indices = await Meta.collection.indexes();
  const correcto = indices.some(
    (indice) =>
      indice.unique === true &&
      Object.keys(indice.key).length === 1 &&
      indice.key.videojuego === 1 &&
      indice.partialFilterExpression?.activa === true &&
      Object.keys(indice.partialFilterExpression).length === 1 &&
      indice.sparse !== true,
  );
  if (!correcto)
    throw new Error(
      "Falta el índice único parcial de Meta; escrituras bloqueadas",
    );
}

export async function inicializarMetas() {
  try {
    // No usar syncIndexes: no borrar índices ni corregir duplicados existentes.
    await Meta.createCollection();
    await Meta.createIndexes();
    await verificarIndiceMetas();
  } catch {
    throw new Error(
      "No se pudo crear o verificar el índice único parcial de Meta",
    );
  }
}

type DocumentoMeta = InstanceType<typeof Meta>;

export function metaDTO(meta: DocumentoMeta) {
  return {
    _id: meta._id.toHexString(),
    videojuego: meta.videojuego.toHexString(),
    minutosObjetivo: meta.minutosObjetivo,
    diasPorSemana: meta.diasPorSemana,
    activa: meta.activa,
    hitos: meta.hitos.map((hito) => ({
      _id: hito._id.toHexString(),
      descripcion: hito.descripcion,
      porcentajeObjetivo: hito.porcentajeObjetivo,
    })),
    createdAt: meta.createdAt.toISOString(),
    updatedAt: meta.updatedAt.toISOString(),
  };
}

async function buscarMeta(id: string) {
  const meta = await Meta.findById(idValido(id));
  if (!meta) throw new ApiError(404, "Meta no encontrada");
  await obtenerVideojuego(meta.videojuego.toHexString());
  return meta;
}

export async function crearMeta(entrada: unknown) {
  const datos = validarCrearMeta(entrada);
  await obtenerVideojuego(datos.videojuego);
  await verificarIndiceMetas();
  try {
    return metaDTO(await Meta.create(datos));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      throw new ApiError(409, "Ya existe una meta activa para este videojuego");
    }
    throw error;
  }
}

export async function obtenerMeta(id: string) {
  return metaDTO(await buscarMeta(id));
}

export async function obtenerMetaActiva(id: string) {
  const videojuego = idValido(id);
  await obtenerVideojuego(videojuego);
  const meta = await Meta.findOne({ videojuego, activa: true });
  return { meta: meta ? metaDTO(meta) : null };
}

export async function actualizarMeta(id: string, entrada: unknown) {
  const meta = await buscarMeta(id);
  const datos = validarEditarMeta(
    entrada,
    new Set(meta.hitos.map((hito) => hito._id.toHexString())),
  );
  if (!meta.activa)
    throw new ApiError(409, "No se puede editar una meta inactiva");
  const cambios = {
    minutosObjetivo: datos.minutosObjetivo,
    diasPorSemana: datos.diasPorSemana,
    ...(datos.hitos === undefined ? {} : { hitos: datos.hitos }),
  };
  meta.set(cambios);
  await meta.validate();
  await verificarIndiceMetas();
  // Omitir hitos en el DTO preserva los almacenados, también en una edición concurrente.
  const guardada = await Meta.findOneAndUpdate(
    { _id: meta._id, activa: true },
    { $set: cambios },
    { new: true, runValidators: true },
  );
  if (!guardada) {
    if (!(await Meta.exists({ _id: meta._id })))
      throw new ApiError(404, "Meta no encontrada");
    throw new ApiError(409, "La meta fue desactivada; vuelve a consultar");
  }
  return metaDTO(guardada);
}

export async function desactivarMeta(id: string) {
  const meta = await buscarMeta(id);
  if (!meta.activa) return;
  await verificarIndiceMetas();
  const guardada = await Meta.findOneAndUpdate(
    { _id: meta._id, activa: true },
    { $set: { activa: false } },
    { new: true, runValidators: true },
  );
  if (!guardada && !(await Meta.exists({ _id: meta._id })))
    throw new ApiError(404, "Meta no encontrada");
}
