export function EstadoCargaError({
  cargando,
  error,
  reintentar,
  nombre = "Reintentar",
}: {
  cargando: boolean;
  error: string;
  reintentar: () => void;
  nombre?: string;
}) {
  if (cargando)
    return (
      <p
        role="status"
        className="rounded-aviso border border-borde bg-panel p-4 text-cuerpo text-texto-sec"
      >
        Cargando{" "}
        {nombre === "Reintentar progreso"
          ? "progreso semanal"
          : nombre === "Reintentar rachas"
            ? "rachas globales"
            : "datos"}
        …
      </p>
    );
  if (!error) return null;
  return (
    <div
      role="alert"
      className="rounded-aviso border border-error bg-panel p-4 text-cuerpo text-error"
    >
      <p className="break-words">{error}</p>
      <button
        type="button"
        onClick={reintentar}
        className="mt-4 min-h-11 rounded-pill border border-acento px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento"
      >
        {nombre}
      </button>
    </div>
  );
}
