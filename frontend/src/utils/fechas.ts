export function hoyGuayaquil(instante: Date): string {
  const partes = new Intl.DateTimeFormat("es-EC", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)!.value;
  return `${parte("year").padStart(4, "0")}-${parte("month")}-${parte("day")}`;
}

export function formatearFechaCivil(valor: unknown): string {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(valor) ||
    valor.startsWith("0000")
  )
    return "Fecha no disponible";

  const dia = valor.slice(0, 10);
  const fecha = new Date(`${dia}T00:00:00.000Z`);
  const instante = new Date(valor);
  if (
    !Number.isFinite(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== dia ||
    !Number.isFinite(instante.getTime()) ||
    instante.toISOString().slice(0, 10) !== dia
  )
    return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-EC", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(fecha)
    .map((parte) =>
      parte.type === "year" ? parte.value.padStart(4, "0") : parte.value,
    )
    .join("");
}
