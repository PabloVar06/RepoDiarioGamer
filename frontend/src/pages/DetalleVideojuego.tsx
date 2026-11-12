import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { videojuegosApi } from "../api/videojuegosApi";
import { partidasApi } from "../api/partidasApi";
import { metasApi } from "../api/metasApi";
import type { Partida, Resumen, Videojuego } from "../tipos";
import { formatearFechaCivil } from "../utils/fechas";
import { useIndicadoresVideojuego } from "../hooks/useProgresoVideojuego";
import { EstadoCargaError } from "../components/EstadoCargaError";
import { ProgresoSemanal } from "../components/ProgresoSemanal";
import { RachasGlobales } from "../components/RachasGlobales";
import { MetaForm } from "../components/MetaForm";

const secundaria =
  "inline-flex min-h-11 items-center justify-center rounded-pill border border-acento px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento";
export function DetalleVideojuego() {
  const { id = "" } = useParams();
  return <DetalleDelJuego key={id} id={id} />;
}
function DetalleDelJuego({ id }: { id: string }) {
  const [j, setJ] = useState<Videojuego | null>(null);
  const [ps, setPs] = useState<Partida[]>([]);
  const [r, setR] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formularioMeta, setFormularioMeta] = useState(false);
  const numero = useRef(0);
  const indicadores = useIndicadoresVideojuego(id);
  const { progreso, rachas } = indicadores;
  const cargar = useCallback(async () => {
    const turno = ++numero.current;
    setLoading(true);
    setError("");
    try {
      const [juego, partidas, resumen] = await Promise.all([
        videojuegosApi.obtener(id),
        videojuegosApi.partidas(id),
        videojuegosApi.resumen(id),
      ]);
      if (turno !== numero.current) return;
      setJ(juego);
      setPs(partidas);
      setR(resumen);
    } catch (e) {
      if (turno === numero.current) setError((e as Error).message);
    } finally {
      if (turno === numero.current) setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void cargar();
    return () => {
      ++numero.current;
    };
  }, [cargar]);
  async function logro(lid: string, obtenido: boolean) {
    try {
      await videojuegosApi.marcarLogro(id, lid, obtenido);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function eliminarRegistro(partidaId: string) {
    if (
      !window.confirm(
        "¿Eliminar esta partida? Esta acción no se puede deshacer.",
      )
    )
      return;
    try {
      await partidasApi.eliminar(partidaId);
      await Promise.all([cargar(), indicadores.recargarTodo()]);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="space-y-12 text-cuerpo">
      <Link className={secundaria} to="/">
        ← Volver a la biblioteca
      </Link>
      <EstadoCargaError
        cargando={loading && !j}
        error={error}
        reintentar={() => void cargar()}
        nombre="Reintentar detalle"
      />
      {j && (
        <>
          <section className="flex flex-col gap-4 border-b border-borde pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-ayuda text-texto-sec">Detalle del juego</p>
              <h1 className="break-words font-display text-pantalla">
                {j.nombre}
              </h1>
              <p className="mt-2 text-texto-sec">
                {j.plataforma} · {j.genero} ·{" "}
                <span className="text-[color:var(--color-destacado)]">
                  {j.estado}
                </span>
              </p>
            </div>
            <Link className={secundaria} to={`/videojuegos/${id}/editar`}>
              Editar juego
            </Link>
          </section>
          <section aria-label="Resumen acumulado E1">
            <h2 className="mb-4 font-display text-seccion">
              Resumen calculado
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["SESIONES", r?.totalPartidas ?? 0],
                ["HORAS JUGADAS", r?.horasTotales ?? 0],
                ["AVANCE ACTUAL", `${r?.porcentajeAvanceActual ?? 0}%`],
                [
                  "ÚLTIMA PARTIDA",
                  r?.ultimaPartida
                    ? formatearFechaCivil(r.ultimaPartida)
                    : "Sin sesiones",
                ],
              ].map(([label, val]) => (
                <div
                  className="min-w-0 rounded-panel border border-borde bg-panel p-6"
                  key={String(label)}
                >
                  <p className="text-ayuda text-texto-sec">{label}</p>
                  <strong className="mt-2 block break-words text-[length:var(--texto-destacado)] font-semibold">
                    {val}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <div className="space-y-6">
            <EstadoCargaError
              cargando={indicadores.sincronizando}
              error={indicadores.errorFecha}
              reintentar={() => void indicadores.recargarTodo()}
              nombre="Reintentar indicadores"
            />
            {!indicadores.ocultar && (
              <>
                <EstadoCargaError
                  cargando={progreso.cargando}
                  error={progreso.error}
                  reintentar={() => void progreso.recargar()}
                  nombre="Reintentar progreso"
                />
                {progreso.datos && (
                  <ProgresoSemanal
                    datos={progreso.datos}
                    onCrearMeta={
                      formularioMeta ? undefined : () => setFormularioMeta(true)
                    }
                  />
                )}
                <EstadoCargaError
                  cargando={rachas.cargando}
                  error={rachas.error}
                  reintentar={() => void rachas.recargar()}
                  nombre="Reintentar rachas"
                />
                {rachas.datos && <RachasGlobales datos={rachas.datos} />}
              </>
            )}
          </div>
          {formularioMeta && (
            <MetaForm
              videojuegoId={id}
              guardar={metasApi.crear}
              consultar={progreso.recargar}
              onCancelar={() => setFormularioMeta(false)}
            />
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="min-w-0 rounded-panel border border-borde bg-panel p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-display text-seccion">Logros</h2>
                <span className="text-ayuda text-exito">
                  {j.logros.filter((l) => l.obtenido).length}/{j.logros.length}
                </span>
              </div>
              {!j.logros.length ? (
                <p className="text-texto-sec">
                  Este juego aún no tiene logros registrados.
                </p>
              ) : (
                j.logros.map((l) => (
                  <label
                    className="mb-2 flex min-h-11 cursor-pointer items-center gap-4 rounded-aviso p-2"
                    key={l._id}
                  >
                    <input
                      className="h-6 w-6 shrink-0 accent-acento"
                      type="checkbox"
                      checked={l.obtenido}
                      onChange={(e) => void logro(l._id, e.target.checked)}
                    />
                    <span className="min-w-0 break-words">
                      <b className="block">{l.nombre}</b>
                      <span className="text-ayuda text-texto-sec">
                        {l.descripcion}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </section>
            <section className="min-w-0 rounded-panel border border-borde bg-panel p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-display text-seccion">Partidas</h2>
                <Link
                  className={secundaria}
                  to={`/partidas/nueva?videojuego=${id}`}
                >
                  + Registrar
                </Link>
              </div>
              {!ps.length ? (
                <p className="text-texto-sec">
                  Todavía no hay sesiones registradas.
                </p>
              ) : (
                ps.map((p) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-4 border-t border-borde py-4"
                    key={p._id}
                  >
                    <div className="min-w-0 flex-1">
                      <b className="block">{formatearFechaCivil(p.fecha)}</b>
                      <p className="break-words text-ayuda text-texto-sec">
                        {p.notas || "Sesión de juego"}
                      </p>
                    </div>
                    <div>
                      <b className="block text-exito">
                        {Math.floor(p.duracionMinutos / 60)}h{" "}
                        {p.duracionMinutos % 60}m
                      </b>
                      <p className="text-ayuda text-texto-sec">
                        {p.porcentajeAvance}% avance
                      </p>
                      <button
                        type="button"
                        onClick={() => void eliminarRegistro(p._id)}
                        className="mt-2 min-h-11 rounded-pill border border-error px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-error"
                        aria-label="Eliminar partida"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
