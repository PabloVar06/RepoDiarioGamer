import { useEffect, useRef } from "react";

// Invertir el calendario de Intl evita depender del TZ del navegador o de Date.UTC(0..99).
export function proximoCambioGuayaquil(dia: string): number {
  const fecha = new Date(`${dia}T00:00:00.000Z`);
  if (
    !Number.isFinite(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== dia ||
    dia.startsWith("0000")
  )
    throw new Error("Fecha de referencia no válida");
  fecha.setUTCDate(fecha.getUTCDate() + 1);
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)!.value;
  const localUTC = new Date(
    `${parte("year").padStart(4, "0")}-${parte("month")}-${parte("day")}T${parte("hour")}:${parte("minute")}:${parte("second")}.000Z`,
  ).getTime();
  if (!Number.isFinite(localUTC))
    throw new Error("Próximo período no representable");
  return fecha.getTime() + (fecha.getTime() - localUTC);
}

export function useActualizacionPeriodo(
  clave: string,
  fecha: string | undefined,
  recargar: () => Promise<void>,
) {
  const diaDisparado = useRef<string>();
  const enCurso = useRef<Promise<void> | null>(null);
  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let evento: ReturnType<typeof setTimeout> | undefined;
    function limpiarTimer() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    }
    function programar() {
      limpiarTimer();
      if (!vivo || !fecha || document.visibilityState !== "visible") return;
      let demora: number;
      try {
        demora = proximoCambioGuayaquil(fecha) - Date.now();
      } catch {
        return;
      } // Con metadatos inválidos se conserva el reintento explícito.
      if (demora <= 0 && diaDisparado.current === fecha) return;
      timer = setTimeout(
        () => {
          diaDisparado.current = fecha;
          void ejecutar();
        },
        Math.max(0, Math.min(demora, 2_147_483_647)),
      );
    }
    function ejecutar() {
      if (!vivo || document.visibilityState !== "visible" || enCurso.current)
        return;
      limpiarTimer();
      const peticion = recargar();
      enCurso.current = peticion;
      void peticion.finally(() => {
        if (enCurso.current === peticion) enCurso.current = null;
        if (vivo) programar();
      });
    }
    function solicitar() {
      if (
        document.visibilityState !== "visible" ||
        evento !== undefined ||
        enCurso.current
      )
        return;
      evento = setTimeout(() => {
        evento = undefined;
        ejecutar();
      }, 0);
    }
    function visibilidad() {
      if (document.visibilityState === "hidden") {
        limpiarTimer();
        if (evento !== undefined) clearTimeout(evento);
        evento = undefined;
      } else solicitar();
    }
    window.addEventListener("focus", solicitar);
    document.addEventListener("visibilitychange", visibilidad);
    programar();
    return () => {
      vivo = false;
      limpiarTimer();
      if (evento !== undefined) clearTimeout(evento);
      window.removeEventListener("focus", solicitar);
      document.removeEventListener("visibilitychange", visibilidad);
    };
  }, [clave, fecha, recargar]);
}
