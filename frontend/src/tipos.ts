export type Plataforma = "PC" | "PlayStation" | "Xbox" | "Switch" | "Movil";
export type Genero =
  "Accion" | "Rol" | "Estrategia" | "Puzzle" | "Deportes" | "Terror" | "Otro";
export type EstadoJuego = "Jugando" | "Pausado" | "Completado" | "Abandonado";
export interface Logro {
  _id: string;
  nombre: string;
  descripcion?: string;
  obtenido: boolean;
}
export interface Videojuego {
  _id: string;
  nombre: string;
  plataforma: Plataforma;
  genero: Genero;
  estado: EstadoJuego;
  logros: Logro[];
  createdAt?: string;
  updatedAt?: string;
}
export interface Partida {
  _id: string;
  videojuego: Videojuego | string;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
  notas?: string;
}
export interface Resumen {
  totalPartidas: number;
  horasTotales: number;
  ultimaPartida: string | null;
  porcentajeAvanceActual: number;
}

export interface HitoDTO {
  _id: string;
  descripcion: string;
  porcentajeObjetivo: number;
}

export interface HitoEvaluado extends HitoDTO {
  alcanzado: boolean;
}

export interface MetaDTO {
  _id: string;
  videojuego: string;
  minutosObjetivo: number;
  diasPorSemana: number;
  hitos: HitoDTO[];
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgresoJuegoDTO {
  videojuego: string;
  zonaHoraria: "America/Guayaquil";
  fechaLocalActual: string;
  semana: { inicio: string; fin: string };
  minutosSemana: number;
  horasSemana: number;
  diasJugados: number;
  porcentajeAvanceActual: number;
  meta: MetaDTO | null;
  porcentajeHoras: number | null;
  metaCumplida: boolean | null;
  hitos: HitoEvaluado[];
}

export interface DetalleErrorApi {
  campo: string;
  mensaje: string;
}
