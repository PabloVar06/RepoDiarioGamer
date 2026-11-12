import { useId, useRef } from "react";

export interface HitoFormulario {
  clave: string;
  _id?: string;
  descripcion: string;
  porcentaje: string;
}
export function validarHitosFormulario(hitos: HitoFormulario[]) {
  const errores: Record<string, string> = {};
  if (hitos.length > 5)
    errores.hitos = "Puedes definir como máximo cinco hitos.";
  hitos.forEach((h, i) => {
    const longitud = h.descripcion.trim().length;
    if (longitud < 1 || longitud > 120)
      errores[`hitos.${i}.descripcion`] =
        "Escribe una descripción de 1 a 120 caracteres.";
    if (
      !h.porcentaje.trim() ||
      !Number.isInteger(Number(h.porcentaje)) ||
      Number(h.porcentaje) < 1 ||
      Number(h.porcentaje) > 100
    )
      errores[`hitos.${i}.porcentajeObjetivo`] =
        "Introduce un porcentaje entero entre 1 y 100.";
  });
  return errores;
}
export function HitosEditor({
  hitos,
  onChange,
  errores,
  disabled,
}: {
  hitos: HitoFormulario[];
  onChange: (hitos: HitoFormulario[]) => void;
  errores: Record<string, string>;
  disabled: boolean;
}) {
  const prefijo = useId();
  const secuencia = useRef(0);
  const cambiar = (indice: number, cambios: Partial<HitoFormulario>) =>
    onChange(hitos.map((h, i) => (i === indice ? { ...h, ...cambios } : h)));
  const control =
    "mt-2 min-h-11 w-full rounded-pill border bg-fondo px-4 py-2 text-cuerpo text-texto disabled:opacity-70";
  return (
    <fieldset disabled={disabled} className="mt-6 min-w-0 space-y-4">
      <legend className="font-display text-seccion">Hitos opcionales</legend>
      <p className="text-ayuda text-texto-sec">
        Hasta cinco objetivos. Su estado depende del mayor avance registrado; no
        se marca manualmente.
      </p>
      {errores.hitos && (
        <p className="text-ayuda text-error">{errores.hitos}</p>
      )}
      {hitos.map((hito, i) => (
        <div
          className="min-w-0 rounded-aviso border border-borde p-4"
          key={hito.clave}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                [
                  "descripcion",
                  `Descripción del hito ${i + 1}`,
                  hito.descripcion,
                  "text",
                ],
                [
                  "porcentajeObjetivo",
                  `Porcentaje objetivo del hito ${i + 1}`,
                  hito.porcentaje,
                  "number",
                ],
              ] as const
            ).map(([campo, etiqueta, valor, tipo]) => {
              const ruta = `hitos.${i}.${campo}`,
                error = errores[ruta];
              const inputId = `${prefijo}-${hito.clave}-${campo}`;
              return (
                <div className="min-w-0" key={campo}>
                  <label htmlFor={inputId}>{etiqueta}</label>
                  <input
                    id={inputId}
                    name={ruta}
                    type={tipo}
                    value={valor}
                    maxLength={tipo === "text" ? 120 : undefined}
                    min={tipo === "number" ? 1 : undefined}
                    max={tipo === "number" ? 100 : undefined}
                    step={tipo === "number" ? 1 : undefined}
                    required
                    onChange={(e) =>
                      cambiar(
                        i,
                        campo === "descripcion"
                          ? { descripcion: e.target.value }
                          : { porcentaje: e.target.value },
                      )
                    }
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className={`${control} ${error ? "border-error" : "border-acento"}`}
                  />
                  {error && (
                    <p
                      id={`${inputId}-error`}
                      className="mt-2 text-ayuda text-error"
                    >
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onChange(hitos.filter((_, n) => n !== i))}
            className="mt-4 min-h-11 rounded-pill border border-error px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-error"
          >
            Quitar hito {i + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={hitos.length >= 5}
        onClick={() =>
          onChange([
            ...hitos,
            {
              clave: `nuevo-${++secuencia.current}`,
              descripcion: "",
              porcentaje: "",
            },
          ])
        }
        className="min-h-11 rounded-pill border border-acento px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento disabled:opacity-70"
      >
        Añadir hito
      </button>
    </fieldset>
  );
}
