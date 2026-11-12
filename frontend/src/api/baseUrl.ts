/** Resolver solo la base compartida; cada cliente conserva sus contratos HTTP. */
export function resolverBaseApi(
  valor: string | undefined,
  esDesarrollo: boolean,
): string {
  const configured = valor?.trim() ?? "";
  if (!configured) {
    if (esDesarrollo) return "/api";
    throw new Error(
      "Falta VITE_API_URL: configura la URL completa del backend terminada en /api.",
    );
  }
  const base = configured.replace(/\/+$/, "");
  if (base === "/api" && esDesarrollo) return base;

  const invalid = () =>
    new Error(
      "VITE_API_URL debe ser una URL HTTP(S) terminada en /api, sin prefijo duplicado, credenciales, consulta ni fragmento.",
    );
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw invalid();
  }
  const segments = url.pathname.split("/").filter(Boolean);
  if (
    !/^https?:\/\//i.test(base) ||
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    base.includes("?") ||
    base.includes("#") ||
    url.pathname.includes("//") ||
    segments[segments.length - 1] !== "api" ||
    segments.filter((part) => part === "api").length !== 1
  )
    throw invalid();

  return `${url.origin}${url.pathname}`;
}
