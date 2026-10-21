export type Plataforma = "PC" | "PlayStation" | "Xbox" | "Switch" | "Movil"; export type Genero = "accion" | "rol" | "estrategia" | "puzzle" | "deportes" | "otro"; export type EstadoJuego = "jugando" | "pausado" | "completado" | "abandonado";
export interface Logro { _id: string; nombre: string; descripcion?: string; obtenido: boolean }
export interface Videojuego { _id: string; nombre: string; plataforma: Plataforma; genero: Genero; estado: EstadoJuego; logros: Logro[]; createdAt?: string; updatedAt?: string }
export interface Partida { _id: string; videojuego: Videojuego | string; fecha: string; duracionMinutos: number; porcentajeAvance: number; notas?: string }
export interface Resumen { totalPartidas: number; horasTotales: number; ultimaPartida: string | null; porcentajeAvanceActual: number }
