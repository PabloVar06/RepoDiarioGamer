import type { Partida } from "../tipos";
import { resolverBaseApi } from "./baseUrl";
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = resolverBaseApi(
    import.meta.env.VITE_API_URL,
    import.meta.env.DEV,
  );
  const r = await fetch(`${base}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!r.ok) {
    const b = await r.json().catch(() => ({}));
    throw new Error(b.error || `Error HTTP ${r.status}`);
  }
  if (r.status === 204) return undefined as T;
  return r.json();
}
export const partidasApi = {
  listar: () => request<Partida[]>("/partidas"),
  crear: (data: unknown) =>
    request<Partida>("/partidas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  eliminar: (id: string) =>
    request<void>(`/partidas/${id}`, { method: "DELETE" }),
};
