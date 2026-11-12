import { useEffect, useId, useRef, useState } from "react";
import { ErrorApi } from "../api/metasApi";
import type { ProgresoJuegoDTO } from "../tipos";

const secundaria =
  "min-h-11 rounded-pill border border-acento px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento disabled:opacity-70";
export function ConfirmarDesactivacion({
  metaId,
  desactivar,
  consultar,
  onCerrar,
  focoAlternativo,
  disparador,
}: {
  metaId: string;
  desactivar: (id: string) => Promise<void>;
  consultar: () => Promise<ProgresoJuegoDTO | null>;
  onCerrar: () => void;
  focoAlternativo: () => HTMLElement | null;
  disparador: HTMLElement;
}) {
  const titulo = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const retorno = useRef(disparador);
  const alternativa = useRef(focoAlternativo);
  const ocupado = useRef(false);
  const [pendiente, setPendiente] = useState(false);
  const [fase, setFase] = useState<"confirmar" | "confirmada" | "revisar">(
    "confirmar",
  );
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);
  const [requestId, setRequestId] = useState<string>();
  useEffect(() => {
    const elemento = dialogo.current!;
    elemento.showModal();
    cancelar.current?.focus();
    return () => {
      elemento.close();
      const destino = retorno.current?.isConnected
        ? retorno.current
        : alternativa.current();
      destino?.focus();
    };
  }, []);
  useEffect(() => {
    if (fase === "confirmada" && !pendiente) cerrar.current?.focus();
  }, [fase, pendiente]);
  async function leer(confirmada: boolean) {
    const datos = await consultar().catch(() => null);
    if (!datos) {
      setError(true);
      setMensaje(
        confirmada
          ? "La meta se desactivó, pero no pudimos actualizar el progreso. Reintenta solo la consulta."
          : "No pudimos comprobar el estado. Reintenta la consulta antes de desactivar otra vez.",
      );
    } else if (confirmada || datos.meta?._id !== metaId) {
      setFase("confirmada");
      setError(false);
      setMensaje(
        confirmada
          ? "Meta desactivada. Tu actividad se conserva."
          : "La meta anterior ya no está activa. Tu actividad se conserva.",
      );
    } else {
      setFase("confirmar");
      setError(false);
      setMensaje("La meta sigue activa. Puedes confirmar su desactivación.");
    }
  }
  async function confirmar() {
    if (ocupado.current || fase !== "confirmar") return;
    ocupado.current = true;
    setPendiente(true);
    setMensaje("");
    setRequestId(undefined);
    try {
      await desactivar(metaId);
      setFase("confirmada");
      await leer(true);
    } catch (e) {
      setFase("revisar");
      setError(true);
      setRequestId(e instanceof ErrorApi ? e.requestId : undefined);
      setMensaje(
        "No podemos confirmar la desactivación. Comprueba el estado antes de volver a intentarlo.",
      );
    } finally {
      ocupado.current = false;
      setPendiente(false);
    }
  }
  async function comprobar() {
    if (ocupado.current) return;
    ocupado.current = true;
    setPendiente(true);
    try {
      await leer(fase === "confirmada");
    } finally {
      ocupado.current = false;
      setPendiente(false);
    }
  }
  return (
    <dialog
      ref={dialogo}
      aria-labelledby={titulo}
      aria-describedby={`${titulo}-descripcion`}
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado.current) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const botones = [...dialogo.current!.querySelectorAll("button")].filter(
          (b) => !b.disabled,
        );
        const primero = botones[0],
          ultimo = botones[botones.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo?.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero?.focus();
        }
      }}
      className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-panel border border-borde bg-panel p-6 text-cuerpo text-texto backdrop:bg-fondo/90"
    >
      <h2 id={titulo} className="font-display text-seccion">
        Desactivar meta
      </h2>
      <p id={`${titulo}-descripcion`} className="mt-4 text-texto-sec">
        Desactivar la meta conserva tus partidas, avance e historial. Podrás
        crear otra meta después.
      </p>
      {pendiente && (
        <p role="status" className="mt-4 text-texto-sec">
          Procesando…
        </p>
      )}
      {mensaje && (
        <div
          className={`mt-4 rounded-aviso border p-4 ${error ? "border-error text-error" : "border-exito text-exito"}`}
        >
          <p role={error ? "alert" : "status"}>{mensaje}</p>
          {requestId && (
            <p className="mt-2 break-words text-ayuda">
              Referencia: {requestId}
            </p>
          )}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-4">
        {fase === "confirmar" && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => void confirmar()}
            className="min-h-11 rounded-pill border border-primario bg-primario px-6 py-2 text-[length:var(--texto-destacado)] font-semibold text-fondo disabled:opacity-70"
          >
            Confirmar desactivación
          </button>
        )}
        {fase === "revisar" && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => void comprobar()}
            className={secundaria}
          >
            Comprobar estado
          </button>
        )}
        {fase === "confirmada" && error && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => void comprobar()}
            className={secundaria}
          >
            Reintentar actualización
          </button>
        )}
        <button
          ref={fase === "confirmada" ? cerrar : cancelar}
          type="button"
          disabled={pendiente}
          onClick={onCerrar}
          className={secundaria}
        >
          {fase === "confirmada" ? "Cerrar" : "Cancelar"}
        </button>
      </div>
    </dialog>
  );
}
