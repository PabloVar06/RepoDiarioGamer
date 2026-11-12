import { useId } from "react";
import type { RachasDTO } from "../tipos";

export function RachasGlobales({ datos }: { datos: RachasDTO }) {
  const titulo = useId();
  return (
    <section
      aria-labelledby={titulo}
      className="rounded-panel border border-borde bg-panel p-6 text-cuerpo"
    >
      <h2 id={titulo} className="font-display text-seccion">
        Rachas globales
      </h2>
      <p className="mt-2 text-ayuda text-texto-sec">
        Todos tus videojuegos, con o sin meta. Días consecutivos, no días de la
        semana.
      </p>
      <dl className="mt-6 grid gap-6 sm:grid-cols-2">
        {[
          ["Racha actual", datos.rachaActual],
          ["Mejor racha histórica", datos.mejorRacha],
        ].map(([etiqueta, dias]) => (
          <div key={etiqueta}>
            <dt className="text-ayuda text-texto-sec">{etiqueta}</dt>
            <dd className="text-[length:var(--texto-destacado)] font-semibold text-[color:var(--color-destacado)]">
              {dias} {dias === 1 ? "día" : "días"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
