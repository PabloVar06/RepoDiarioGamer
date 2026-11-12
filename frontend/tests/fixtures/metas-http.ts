import { vi } from "vitest";
import type { MetaDTO, Partida, Videojuego } from "../../src/tipos";
import { juegoE2, metaE2, progresoE2, rachasE2 } from "./e2";

export const jsonApi = (datos: unknown, status = 200) =>
  new Response(JSON.stringify(datos), { status });
export function instalarApiMetas() {
  const api = {
    juego: structuredClone(juegoE2) as Videojuego,
    otros: [] as Videojuego[],
    eliminado: false,
    meta: structuredClone(metaE2) as MetaDTO | null,
    partidas: [] as Partida[],
    minutos: 420,
    dias: 2,
    avance: 80,
    fallosProgreso: 0,
    solicitudes: [] as {
      metodo: string;
      ruta: string;
      datos?: Record<string, unknown>;
    }[],
    desactivar: undefined as undefined | (() => Promise<Response>),
    actualizar: undefined as
      undefined | ((datos: Record<string, unknown>) => Promise<Response>),
  };
  vi.mocked(fetch).mockImplementation(async (input, opciones) => {
    const ruta = new URL(String(input)).pathname;
    const metodo = opciones?.method ?? "GET";
    const datos = opciones?.body
      ? JSON.parse(String(opciones.body))
      : undefined;
    api.solicitudes.push({ metodo, ruta, ...(datos ? { datos } : {}) });
    const normalizarHitos = (
      hitos: {
        _id?: string;
        descripcion: string;
        porcentajeObjetivo: number;
      }[],
    ) =>
      hitos.map((h, i) => ({
        ...h,
        _id: h._id ?? (100 + i).toString(16).padStart(24, "0"),
      }));
    if (ruta === "/api/videojuegos")
      return jsonApi([...(api.eliminado ? [] : [api.juego]), ...api.otros]);
    if (metodo === "DELETE" && ruta === `/api/videojuegos/${juegoE2._id}`) {
      api.eliminado = true;
      api.meta = null;
      api.partidas = [];
      return new Response(null, { status: 204 });
    }
    if (metodo === "POST" && ruta === "/api/partidas") {
      api.partidas.push({
        ...datos,
        _id: "7123456789abcdef01234567",
        fecha: `${datos.fecha}T00:00:00.000Z`,
      });
      api.minutos += datos.duracionMinutos;
      api.avance = Math.max(api.avance, datos.porcentajeAvance);
      api.dias = 1;
      return jsonApi(api.partidas[api.partidas.length - 1], 201);
    }
    if (ruta === "/api/partidas")
      return jsonApi(
        api.partidas.map((p) => ({ ...p, videojuego: api.juego })),
      );
    if (ruta.endsWith("/progreso") && !ruta.includes(juegoE2._id))
      return jsonApi(
        progresoE2({
          videojuego: ruta.split("/")[3],
          meta: null,
          porcentajeHoras: null,
          metaCumplida: null,
          hitos: [],
          minutosSemana: 0,
          horasSemana: 0,
          diasJugados: 0,
        }),
      );
    const otro = api.otros.find((j) => ruta === `/api/videojuegos/${j._id}`);
    if (otro) return jsonApi(otro);
    if (metodo === "POST" && ruta === "/api/metas") {
      api.meta = {
        ...metaE2,
        ...datos,
        hitos: normalizarHitos(datos.hitos ?? []),
      };
      return jsonApi(api.meta, 201);
    }
    if (metodo === "DELETE" && ruta.startsWith("/api/partidas/")) {
      api.partidas = api.partidas.filter((p) => !ruta.endsWith(p._id));
      api.avance = Math.max(0, ...api.partidas.map((p) => p.porcentajeAvance));
      return new Response(null, { status: 204 });
    }
    if (metodo === "DELETE" && ruta.startsWith("/api/metas/")) {
      if (api.desactivar) return api.desactivar();
      api.meta = null;
      return new Response(null, { status: 204 });
    }
    if (metodo === "PUT" && ruta.startsWith("/api/metas/")) {
      if (api.actualizar) return api.actualizar(datos);
      if (!api.meta?.activa)
        return jsonApi(
          { error: "La meta está inactiva", requestId: "prueba" },
          409,
        );
      api.meta = {
        ...api.meta,
        ...datos,
        ...(datos.hitos === undefined
          ? {}
          : { hitos: normalizarHitos(datos.hitos) }),
      };
      return jsonApi(api.meta);
    }
    if (ruta.endsWith("/progreso")) {
      if (api.fallosProgreso > 0) {
        api.fallosProgreso--;
        return jsonApi({ error: "Lectura fallida" }, 500);
      }
      return jsonApi(
        progresoE2({
          minutosSemana: api.minutos,
          horasSemana: api.minutos / 60,
          diasJugados: api.dias,
          porcentajeAvanceActual: api.avance,
          meta: api.meta,
          porcentajeHoras: api.meta
            ? (api.minutos / api.meta.minutosObjetivo) * 100
            : null,
          metaCumplida: api.meta
            ? api.minutos >= api.meta.minutosObjetivo &&
              api.dias >= api.meta.diasPorSemana
            : null,
          hitos:
            api.meta?.hitos.map((h) => ({
              ...h,
              alcanzado: api.avance >= h.porcentajeObjetivo,
            })) ?? [],
        }),
      );
    }
    if (ruta === "/api/rachas") return jsonApi(rachasE2());
    if (ruta === `/api/videojuegos/${juegoE2._id}`) return jsonApi(api.juego);
    if (ruta.endsWith("/partidas")) return jsonApi(api.partidas);
    if (ruta.endsWith("/resumen"))
      return jsonApi({
        totalPartidas: api.partidas.length,
        horasTotales: 20,
        ultimaPartida: null,
        porcentajeAvanceActual: api.avance,
      });
    throw new Error(`Ruta no simulada: ${metodo} ${ruta}`);
  });
  return api;
}
