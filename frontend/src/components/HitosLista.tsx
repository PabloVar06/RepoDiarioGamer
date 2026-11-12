import { useId } from "react";
import type { HitoEvaluado } from "../tipos";

export function HitosLista({ hitos }: { hitos: HitoEvaluado[] }) {
  const titulo = useId();
  return (
    <section
      aria-labelledby={titulo}
      className="mt-6 border-t border-borde pt-6"
    >
      <h3 id={titulo} className="font-display text-seccion">
        Hitos de la meta
      </h3>
      {!hitos.length ? (
        <p className="mt-4 text-texto-sec">
          Esta meta no tiene hitos. Puedes añadir hasta cinco al editarla.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {hitos.map((h) => (
            <li key={h._id} className="rounded-aviso border border-borde p-4">
              <p className="break-words font-semibold">{h.descripcion}</p>
              <p className="mt-2 text-ayuda text-texto-sec">
                Objetivo: {h.porcentajeObjetivo} % del avance acumulado
              </p>
              <p
                className={`mt-2 flex items-center gap-2 ${h.alcanzado ? "text-exito" : "text-texto-sec"}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  {h.alcanzado ? (
                    <path d="m7 12 3 3 7-7" />
                  ) : (
                    <path d="M12 7v5l3 2" />
                  )}
                </svg>
                {h.alcanzado ? "Alcanzado" : "Pendiente"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
