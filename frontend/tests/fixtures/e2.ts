import type {
  MetaDTO,
  ProgresoJuegoDTO,
  RachasDTO,
  Videojuego,
} from "../../src/tipos";

export const rachasE2 = (): RachasDTO => ({
  ambito: "global",
  zonaHoraria: "America/Guayaquil",
  fechaLocalActual: "2026-11-15",
  rachaActual: 1,
  mejorRacha: 5,
});

export const juegoE2: Videojuego = {
  _id: "0123456789abcdef01234567",
  nombre: "Aventura semanal",
  plataforma: "PC",
  genero: "Rol",
  estado: "Jugando",
  logros: [],
};
export const metaE2: MetaDTO = {
  _id: "1123456789abcdef01234567",
  videojuego: juegoE2._id,
  minutosObjetivo: 300,
  diasPorSemana: 3,
  activa: true,
  hitos: [],
  createdAt: "2026-11-09T12:00:00.000Z",
  updatedAt: "2026-11-09T12:00:00.000Z",
};
export const progresoE2 = (
  cambios: Partial<ProgresoJuegoDTO> = {},
): ProgresoJuegoDTO => ({
  videojuego: juegoE2._id,
  zonaHoraria: "America/Guayaquil",
  fechaLocalActual: "2026-11-15",
  semana: { inicio: "2026-11-09", fin: "2026-11-15" },
  minutosSemana: 90,
  horasSemana: 1.5,
  diasJugados: 1,
  porcentajeAvanceActual: 30,
  meta: null,
  porcentajeHoras: null,
  metaCumplida: null,
  hitos: [],
  ...cambios,
});
export function pendiente<T>() {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((resolve) => {
    resolver = resolve;
  });
  return { promesa, resolver };
}
