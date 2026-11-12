import { useId } from "react";
import type { ProgresoJuegoDTO } from "../tipos";
import { formatearFechaCivil } from "../utils/fechas";

const formato = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 2 });
function porcentaje(valor: number) {
  if (valor !== 100 && Math.round(valor * 100) / 100 === 100)
    return valor < 100 ? "<100 %" : ">100 %";
  return `${formato.format(valor)} %`;
}
export function ProgresoSemanal({
  datos,
  onCrearMeta,
}: {
  datos: ProgresoJuegoDTO;
  onCrearMeta?: () => void;
}) {
  const titulo = useId();
  const meta = datos.meta;
  return (
    <section
      aria-labelledby={titulo}
      className="min-w-0 rounded-panel border border-borde bg-panel p-6 text-cuerpo"
    >
      <h2 id={titulo} className="font-display text-seccion">
        Progreso semanal
      </h2>
      <p className="mt-2 text-ayuda text-texto-sec">
        {formatearFechaCivil(datos.semana.inicio)} –{" "}
        {formatearFechaCivil(datos.semana.fin)} · America/Guayaquil
      </p>
      <dl className="mt-6 grid gap-6 sm:grid-cols-3">
        <div>
          <dt className="text-ayuda text-texto-sec">Horas esta semana</dt>
          <dd className="text-[length:var(--texto-destacado)] font-semibold text-[color:var(--color-destacado)]">
            {formato.format(datos.horasSemana)} h
          </dd>
          <dd className="text-ayuda text-texto-sec">
            {formato.format(datos.minutosSemana)} minutos
          </dd>
        </div>
        <div>
          <dt className="text-ayuda text-texto-sec">Días esta semana</dt>
          <dd className="text-[length:var(--texto-destacado)] font-semibold">
            {datos.diasJugados}{" "}
            {datos.diasJugados === 1 ? "día jugado" : "días jugados"}
          </dd>
        </div>
        <div>
          <dt className="text-ayuda text-texto-sec">
            Avance acumulado del juego
          </dt>
          <dd className="text-[length:var(--texto-destacado)] font-semibold">
            {porcentaje(datos.porcentajeAvanceActual)}
          </dd>
        </div>
      </dl>
      {datos.minutosSemana === 0 && datos.diasJugados === 0 && (
        <p className="mt-4 text-texto-sec">
          Todavía no hay partidas esta semana.
        </p>
      )}
      {meta && datos.porcentajeHoras !== null ? (
        <div className="mt-6 space-y-4">
          <p>
            Objetivo: {Math.floor(meta.minutosObjetivo / 60)} h{" "}
            {meta.minutosObjetivo % 60} min · {meta.diasPorSemana}{" "}
            {meta.diasPorSemana === 1 ? "día" : "días"} por semana
          </p>
          <p>
            Cumplimiento de horas:{" "}
            <strong>{porcentaje(datos.porcentajeHoras)}</strong>
          </p>
          <div
            role="progressbar"
            aria-label="Cumplimiento de horas"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, datos.porcentajeHoras)}
            aria-valuetext={porcentaje(datos.porcentajeHoras)}
            className="h-2 overflow-hidden rounded-pill bg-fondo"
          >
            <div
              className="h-full bg-acento"
              style={{ width: `${Math.min(100, datos.porcentajeHoras)}%` }}
            />
          </div>
          <p>
            Días jugados: {datos.diasJugados} / {meta.diasPorSemana}
          </p>
          <p className={datos.metaCumplida ? "text-exito" : "text-texto-sec"}>
            {datos.metaCumplida
              ? "Meta semanal cumplida"
              : "Meta semanal pendiente: requiere horas y días"}
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-aviso border border-borde p-4">
          <p className="font-semibold">Sin meta activa</p>
          <p className="mt-2 text-texto-sec">
            Crea una meta para seguir tu progreso semanal.
          </p>
          {onCrearMeta && (
            <button
              type="button"
              onClick={onCrearMeta}
              className="mt-4 min-h-11 rounded-pill border border-primario bg-primario px-6 py-2 text-[length:var(--texto-destacado)] font-semibold text-fondo"
            >
              Crear meta
            </button>
          )}
        </div>
      )}
    </section>
  );
}
