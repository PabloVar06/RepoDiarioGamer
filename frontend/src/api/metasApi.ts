import type {
  DetalleErrorApi,
  HitoDTO,
  MetaDTO,
  ProgresoJuegoDTO,
} from "../tipos";
import { resolverBaseApi } from "./baseUrl";

export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public readonly status?: number,
    public readonly requestId?: string,
    public readonly detalles?: DetalleErrorApi[],
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function numero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
}

function entero(
  valor: unknown,
  minimo: number,
  maximo: number,
): valor is number {
  return (
    numero(valor) &&
    Number.isInteger(valor) &&
    valor >= minimo &&
    valor <= maximo
  );
}

function id(valor: unknown): valor is string {
  return typeof valor === "string" && /^[a-f0-9]{24}$/i.test(valor);
}

function fechaCivil(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

function timestamp(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(valor)
  );
}

function hito(valor: unknown): valor is HitoDTO {
  return (
    objeto(valor) &&
    id(valor._id) &&
    typeof valor.descripcion === "string" &&
    valor.descripcion.trim().length > 0 &&
    valor.descripcion.length <= 120 &&
    entero(valor.porcentajeObjetivo, 1, 100)
  );
}

function meta(valor: unknown): valor is MetaDTO {
  return (
    objeto(valor) &&
    id(valor._id) &&
    id(valor.videojuego) &&
    entero(valor.minutosObjetivo, 1, 6000) &&
    entero(valor.diasPorSemana, 1, 7) &&
    typeof valor.activa === "boolean" &&
    timestamp(valor.createdAt) &&
    timestamp(valor.updatedAt) &&
    Array.isArray(valor.hitos) &&
    valor.hitos.length <= 5 &&
    valor.hitos.every(hito)
  );
}

function esProgreso(
  valor: unknown,
  videojuegoId: string,
): valor is ProgresoJuegoDTO {
  if (
    !objeto(valor) ||
    !id(valor.videojuego) ||
    valor.videojuego.toLowerCase() !== videojuegoId.toLowerCase() ||
    valor.zonaHoraria !== "America/Guayaquil" ||
    !fechaCivil(valor.fechaLocalActual) ||
    !objeto(valor.semana) ||
    !fechaCivil(valor.semana.inicio) ||
    !fechaCivil(valor.semana.fin) ||
    !numero(valor.minutosSemana) ||
    !numero(valor.horasSemana) ||
    !entero(valor.diasJugados, 0, 7) ||
    !numero(valor.porcentajeAvanceActual) ||
    valor.porcentajeAvanceActual > 100 ||
    !Array.isArray(valor.hitos) ||
    valor.hitos.length > 5 ||
    !valor.hitos.every(
      (entrada) =>
        hito(entrada) &&
        objeto(entrada) &&
        typeof entrada.alcanzado === "boolean",
    )
  ) {
    return false;
  }
  if (valor.meta === null) {
    return (
      valor.porcentajeHoras === null &&
      valor.metaCumplida === null &&
      valor.hitos.length === 0
    );
  }
  return (
    meta(valor.meta) &&
    valor.meta.activa &&
    valor.meta.videojuego.toLowerCase() === valor.videojuego.toLowerCase() &&
    numero(valor.porcentajeHoras) &&
    typeof valor.metaCumplida === "boolean"
  );
}

function comprobarCancelacion(signal?: AbortSignal, error?: unknown) {
  if (signal?.aborted) throw signal.reason;
  if (objeto(error) && error.name === "AbortError") throw error;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor : undefined;
}

function detallesPermitidos(valor: unknown): DetalleErrorApi[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  const detalles = valor.flatMap((entrada) =>
    objeto(entrada) && texto(entrada.campo) && texto(entrada.mensaje)
      ? [{ campo: entrada.campo as string, mensaje: entrada.mensaje as string }]
      : [],
  );
  return detalles.length ? detalles : undefined;
}

export const metasApi = {
  async progreso(
    videojuegoId: string,
    signal?: AbortSignal,
  ): Promise<ProgresoJuegoDTO> {
    comprobarCancelacion(signal);
    let base: string;
    try {
      base = resolverBaseApi(import.meta.env.VITE_API_URL, import.meta.env.DEV);
    } catch (error) {
      throw new ErrorApi(
        error instanceof Error
          ? error.message
          : "Revisa la configuración VITE_API_URL.",
      );
    }
    let respuesta: Response;
    try {
      respuesta = await fetch(
        `${base}/videojuegos/${encodeURIComponent(videojuegoId)}/progreso`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal,
        },
      );
    } catch (error) {
      comprobarCancelacion(signal, error);
      throw new ErrorApi(
        "No pudimos conectar con la API. Revisa tu conexión e inténtalo de nuevo.",
      );
    }
    let cuerpo: unknown;
    if (respuesta.status !== 204) {
      try {
        cuerpo = await respuesta.json();
      } catch (error) {
        comprobarCancelacion(signal, error);
      }
    }
    comprobarCancelacion(signal);
    const datos = objeto(cuerpo) ? cuerpo : undefined;
    const requestId =
      texto(datos?.requestId) ?? texto(respuesta.headers.get("x-request-id"));
    if (!respuesta.ok) {
      const esServidor = respuesta.status >= 500;
      throw new ErrorApi(
        esServidor
          ? "No pudimos consultar el progreso. Inténtalo de nuevo."
          : (texto(datos?.error) ??
              `No pudimos consultar el progreso (HTTP ${respuesta.status}).`),
        respuesta.status,
        requestId,
        esServidor ? undefined : detallesPermitidos(datos?.detalles),
      );
    }
    if (respuesta.status !== 200 || !esProgreso(cuerpo, videojuegoId)) {
      throw new ErrorApi(
        "La API devolvió una respuesta de progreso no válida. Inténtalo de nuevo.",
        respuesta.status,
        requestId,
      );
    }
    return cuerpo;
  },
};
