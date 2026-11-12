import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ErrorApi } from "../api/metasApi";
import type { CrearMeta, MetaDTO, ProgresoJuegoDTO } from "../tipos";

type Campo = "horas" | "minutos" | "dias";
type Situacion = "editar" | "enviando" | "revisar" | "confirmada" | "existente";
type Errores = Partial<Record<Campo, string>>;
const control =
  "mt-2 min-h-11 w-full rounded-pill border bg-fondo px-4 py-2 text-cuerpo text-texto disabled:opacity-70";
const secundaria =
  "min-h-11 rounded-pill border border-acento px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento disabled:opacity-70";

export function MetaForm({
  videojuegoId,
  guardar,
  consultar,
  onCancelar,
}: {
  videojuegoId: string;
  guardar: (datos: CrearMeta) => Promise<MetaDTO>;
  consultar: () => Promise<ProgresoJuegoDTO | null>;
  onCancelar: () => void;
}) {
  const prefijo = useId();
  const [horas, setHoras] = useState("");
  const [minutos, setMinutos] = useState("0");
  const [dias, setDias] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [situacion, setSituacion] = useState<Situacion>("editar");
  const [consultando, setConsultando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [requestId, setRequestId] = useState<string>();
  const [actualizada, setActualizada] = useState(false);
  const ocupado = useRef(false);
  const campos = useRef<Partial<Record<Campo, HTMLInputElement | null>>>({});
  useEffect(() => {
    campos.current.horas?.focus();
  }, []);
  const bloqueado = situacion === "enviando" || consultando;

  async function leer(confirmada: boolean) {
    setConsultando(true);
    try {
      const datos = await consultar().catch(() => null);
      if (confirmada) {
        setActualizada(!!datos);
        setEsError(!datos);
        setMensaje(
          datos
            ? "Meta creada. Progreso actualizado."
            : "La meta se creó, pero no pudimos actualizar el progreso. Reintenta solo la consulta.",
        );
      } else if (datos?.meta) {
        setSituacion("existente");
        setEsError(true);
        setMensaje(
          "Ya existe una meta activa. Conservamos tu borrador; vuelve al progreso para consultar la meta vigente.",
        );
      } else if (datos) {
        setSituacion("editar");
        setEsError(false);
        setMensaje(
          "Consulta confirmada: no hay meta activa. Puedes volver a guardar.",
        );
      } else {
        setSituacion("revisar");
        setEsError(true);
        setMensaje(
          "No pudimos comprobar si existe una meta. Reconsulta antes de intentar guardarla otra vez.",
        );
      }
    } finally {
      setConsultando(false);
    }
  }
  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (ocupado.current || situacion !== "editar" || consultando) return;
    const enteros = (valor: string, minimo: number, maximo: number) =>
      valor.trim() !== "" &&
      Number.isInteger(Number(valor)) &&
      Number(valor) >= minimo &&
      Number(valor) <= maximo;
    const fallos: Errores = {};
    if (!enteros(horas, 0, 100))
      fallos.horas = "Introduce horas enteras entre 0 y 100.";
    if (!enteros(minutos, 0, 59))
      fallos.minutos = "Introduce minutos enteros entre 0 y 59.";
    const minutosObjetivo = Number(horas) * 60 + Number(minutos);
    if (
      !fallos.horas &&
      !fallos.minutos &&
      (minutosObjetivo < 1 || minutosObjetivo > 6000)
    )
      fallos.horas =
        "El objetivo debe ser mayor que 0 y como máximo 100 horas (6000 minutos).";
    if (!enteros(dias, 1, 7))
      fallos.dias = "Introduce días enteros entre 1 y 7.";
    setErrores(fallos);
    setRequestId(undefined);
    if (Object.keys(fallos).length) {
      setEsError(true);
      setMensaje("Revisa los campos indicados antes de guardar.");
      campos.current[Object.keys(fallos)[0] as Campo]?.focus();
      return;
    }
    ocupado.current = true;
    setSituacion("enviando");
    setMensaje("");
    try {
      await guardar({
        videojuego: videojuegoId,
        minutosObjetivo,
        diasPorSemana: Number(dias),
      });
      setSituacion("confirmada");
      setEsError(false);
      setMensaje("Meta creada. Actualizando progreso…");
      await leer(true);
    } catch (error) {
      setEsError(true);
      if (error instanceof ErrorApi) setRequestId(error.requestId);
      if (error instanceof ErrorApi && error.status === 400) {
        const detalles: Errores = {};
        for (const detalle of error.detalles ?? []) {
          if (detalle.campo === "diasPorSemana")
            detalles.dias = detalle.mensaje;
          if (detalle.campo === "minutosObjetivo")
            detalles.horas = detalle.mensaje;
        }
        setErrores(detalles);
        setSituacion("editar");
        setMensaje(error.message);
      } else if (error instanceof ErrorApi && error.status === 409) {
        setSituacion("revisar");
        setMensaje(
          "Ya existe una meta activa. Estamos reconsultando el progreso; conservamos tu borrador.",
        );
        await leer(false);
      } else {
        setSituacion("revisar");
        setMensaje(
          "No podemos confirmar si se creó la meta. Conservamos tus datos: reconsulta antes de volver a guardar.",
        );
      }
    } finally {
      ocupado.current = false;
    }
  }
  return (
    <form
      aria-label="Crear meta semanal"
      onSubmit={enviar}
      noValidate
      className="rounded-panel border border-borde bg-panel p-6 text-cuerpo"
    >
      <h2 className="font-display text-seccion">Crear meta semanal</h2>
      <p id={`${prefijo}-ayuda`} className="mt-2 text-ayuda text-texto-sec">
        Define un objetivo de 1 a 6000 minutos y de 1 a 7 días por semana. Se
        incluye la actividad ya registrada esta semana.
      </p>
      <fieldset
        disabled={
          bloqueado || situacion === "confirmada" || situacion === "existente"
        }
        className="mt-6 grid min-w-0 gap-4 sm:grid-cols-3"
      >
        <legend className="sr-only">Objetivos semanales</legend>
        {(
          [
            ["horas", "Horas", horas, setHoras, 0, 100],
            ["minutos", "Minutos", minutos, setMinutos, 0, 59],
            ["dias", "Días por semana", dias, setDias, 1, 7],
          ] as const
        ).map(([campo, etiqueta, valor, cambiar, minimo, maximo]) => (
          <div className="min-w-0" key={campo}>
            <label htmlFor={`${prefijo}-${campo}`}>{etiqueta}</label>
            <input
              ref={(elemento) => {
                campos.current[campo] = elemento;
              }}
              id={`${prefijo}-${campo}`}
              type="number"
              inputMode="numeric"
              min={minimo}
              max={maximo}
              step={1}
              required
              value={valor}
              onChange={(e) => cambiar(e.target.value)}
              className={`${control} ${errores[campo] ? "border-error" : "border-acento"}`}
              aria-invalid={!!errores[campo]}
              aria-describedby={`${prefijo}-ayuda${errores[campo] ? ` ${prefijo}-${campo}-error` : ""}`}
            />
            {errores[campo] && (
              <p
                id={`${prefijo}-${campo}-error`}
                className="mt-2 text-ayuda text-error"
              >
                {errores[campo]}
              </p>
            )}
          </div>
        ))}
      </fieldset>
      {mensaje && (
        <div
          className={`mt-6 rounded-aviso border p-4 ${esError ? "border-error text-error" : "border-exito text-exito"}`}
        >
          <p role={esError ? "alert" : "status"}>{mensaje}</p>
          {requestId && (
            <p className="mt-2 break-words text-ayuda">
              Referencia: {requestId}
            </p>
          )}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-4">
        {situacion !== "confirmada" && (
          <button
            type="submit"
            disabled={bloqueado || situacion !== "editar"}
            className="min-h-11 rounded-pill border border-primario bg-primario px-6 py-2 text-[length:var(--texto-destacado)] font-semibold text-fondo disabled:opacity-70"
          >
            {situacion === "enviando" ? "Guardando…" : "Guardar meta"}
          </button>
        )}
        {situacion === "revisar" && (
          <button
            type="button"
            disabled={bloqueado}
            onClick={() => void leer(false)}
            className={secundaria}
          >
            Reconsultar antes de guardar
          </button>
        )}
        {situacion === "confirmada" && !actualizada && (
          <button
            type="button"
            disabled={bloqueado}
            onClick={() => void leer(true)}
            className={secundaria}
          >
            Reintentar actualización
          </button>
        )}
        <button
          type="button"
          disabled={bloqueado}
          onClick={onCancelar}
          className={secundaria}
        >
          {situacion === "confirmada" || situacion === "existente"
            ? "Volver al progreso"
            : "Cancelar"}
        </button>
      </div>
    </form>
  );
}
