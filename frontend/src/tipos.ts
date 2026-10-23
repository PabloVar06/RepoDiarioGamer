export type Plataforma = "PC" | "PlayStation" | "Xbox" | "Switch" | "Movil"; export type Genero = "Accion" | "Rol" | "Estrategia" | "Puzzle" | "Deportes" | "Terror"| "Otro"; export type EstadoJuego = "Jugando" | "Pausado" | "Completado" | "Abandonado";
export interface Logro { _id: string; nombre: string; descripcion?: string; obtenido: boolean }
export interface Videojuego { _id: string; nombre: string; plataforma: Plataforma; genero: Genero; estado: EstadoJuego; logros: Logro[]; createdAt?: string; updatedAt?: string }
export interface Partida { _id: string; videojuego: Videojuego | string; fecha: string; duracionMinutos: number; porcentajeAvance: number; notas?: string }
export interface Resumen { totalPartidas: number; horasTotales: number; ultimaPartida: string | null; porcentajeAvanceActual: number }
