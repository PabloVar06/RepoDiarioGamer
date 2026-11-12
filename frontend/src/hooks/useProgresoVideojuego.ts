import { useCallback, useEffect, useRef, useState } from "react";
import { metasApi } from "../api/metasApi";
import type { ProgresoJuegoDTO, RachasDTO } from "../tipos";
import { useActualizacionPeriodo } from "./useActualizacionPeriodo";

function useConsulta<T>(
  id: string,
  consultar: (id: string, signal: AbortSignal) => Promise<T>,
) {
  const [estado, setEstado] = useState<{
    id: string;
    datos: T | null;
    cargando: boolean;
    error: string;
  }>({ id, datos: null, cargando: true, error: "" });
  const numero = useRef(0);
  const peticion = useRef<AbortController>();
  const recargar = useCallback(async () => {
    const turno = ++numero.current;
    peticion.current?.abort();
    const controlador = new AbortController();
    peticion.current = controlador;
    setEstado({ id, datos: null, cargando: true, error: "" });
    try {
      const datos = await consultar(id, controlador.signal);
      if (turno !== numero.current || controlador.signal.aborted) return null;
      setEstado({ id, datos, cargando: false, error: "" });
      return datos;
    } catch (error) {
      if (turno === numero.current && !controlador.signal.aborted)
        setEstado({
          id,
          datos: null,
          cargando: false,
          error:
            error instanceof Error
              ? error.message
              : "No pudimos consultar el progreso. Inténtalo de nuevo.",
        });
      return null;
    }
  }, [id, consultar]);
  useEffect(() => {
    void recargar();
    return () => {
      ++numero.current;
      peticion.current?.abort();
    };
  }, [recargar]);
  return {
    ...(estado.id === id ? estado : { datos: null, cargando: true, error: "" }),
    recargar,
  };
}

const consultarProgreso = (id: string, signal: AbortSignal) =>
  metasApi.progreso(id, signal);
const consultarRachas = (_id: string, signal: AbortSignal) =>
  metasApi.rachas(signal);
export function useProgresoVideojuego(id: string) {
  return useConsulta<ProgresoJuegoDTO>(id, consultarProgreso);
}
function useRachasGlobales(id: string) {
  return useConsulta<RachasDTO>(id, consultarRachas);
}

export function useIndicadoresVideojuego(id: string) {
  const progreso = useProgresoVideojuego(id);
  const rachas = useRachasGlobales(id);
  const [sincronizacion, setSincronizacion] = useState<
    "libre" | "cargando" | "error"
  >("libre");
  const desfase = !!(
    progreso.datos &&
    rachas.datos &&
    progreso.datos.fechaLocalActual !== rachas.datos.fechaLocalActual
  );
  const fechaPeriodo = useRef<string>();
  if (!desfase)
    fechaPeriodo.current =
      progreso.datos?.fechaLocalActual ??
      rachas.datos?.fechaLocalActual ??
      fechaPeriodo.current;
  const recargarTodo = useCallback(async () => {
    setSincronizacion("cargando");
    const [p, r] = await Promise.all([progreso.recargar(), rachas.recargar()]);
    setSincronizacion(
      p && r && p.fechaLocalActual !== r.fechaLocalActual ? "error" : "libre",
    );
  }, [progreso.recargar, rachas.recargar]);
  useEffect(() => {
    if (desfase && sincronizacion === "libre") void recargarTodo();
  }, [desfase, sincronizacion, recargarTodo]);
  useActualizacionPeriodo(id, fechaPeriodo.current, recargarTodo);
  return {
    progreso,
    rachas,
    recargarTodo,
    ocultar: desfase || sincronizacion === "cargando",
    sincronizando: sincronizacion === "cargando",
    errorFecha:
      sincronizacion === "error"
        ? "Los indicadores llegaron con fechas distintas. Reintenta la consulta para ver un mismo día."
        : "",
  };
}
