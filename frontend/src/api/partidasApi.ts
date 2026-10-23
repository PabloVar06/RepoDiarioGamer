import type { Partida } from "../tipos";
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
async function request<T>(path: string, options?: RequestInit): Promise<T> { const r = await fetch(`${BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } }); if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.error || `Error HTTP ${r.status}`); } if (r.status === 204) return undefined as T; return r.json(); }
export const partidasApi = { listar: () => request<Partida[]>("/partidas"), crear: (data: unknown) => request<Partida>("/partidas", { method: "POST", body: JSON.stringify(data) }), eliminar: (id: string) => request<void>(`/partidas/${id}`, { method: "DELETE" }) };
