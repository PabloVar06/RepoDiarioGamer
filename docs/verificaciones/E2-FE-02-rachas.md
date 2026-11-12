# E2-FE-02 — presentación de rachas globales

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado y verificado automáticamente; pendiente de revisión visual
conjunta y del usuario. Autorizado en el bloque incremental pasos 4–6. Dependencias:
HAB-01/05 implementados y [BE-02 verificado](E2-BE-02-rachas.md) antes de este corte.
Sin staging, commit ni push.

Fuentes: [frontend FE-AC03/08/09/12 y §§4–7](../specs/E2-frontend.md),
[backlog FE-02](../backlog/E2-metas-y-rachas.md), [DESIGN](../../DESIGN.md).

Cliente GET `/api/rachas` sin filtro/cuerpo; valida ámbito/zona/enteros y
mejor ≥ actual. Reutiliza el tratamiento HTTP del cliente E2, sin cambiar los
clientes E1. `RachasGlobales` diferencia racha actual/mejor histórica y explica
su alcance sobre todos los videojuegos, incluso sin meta.

| Criterio                               | Verificación                                                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC04/11: rachas globales y ceros       | `tests/rachas.test.tsx`: un día actual/cinco mejor, separados del día semanal del juego; ambos ceros sin partidas ni meta.                                |
| FE-AC12: estados independientes        | Carga no inventa ceros; fallo de rachas conserva resumen/progreso; reintento exclusivo GET rachas.                                                        |
| FE-AC09: fecha coherente / cancelación | Abort al desmontar; desfase entre ambos DTO reconsulta ambos una vez; desfase persistente oculta el conjunto, avisa y permite reintento manual sin bucle. |
| AC06/13 / INT-01 incremental           | Eliminación de partida reconsulta rachas, progreso, historial y resumen; conserva confirmación y regresiones E1.                                          |
| Servicio                               | `src/api/rachasApi.test.ts`: contrato/señal/ceros, DTO inválidos, 400/404/500, no JSON y cancelación sin falsear resultados.                              |

Pruebas primero: **18 fallos** antes de implementar servicio/tipo/componente.
Después: frontend `npm test` **181/181**; `npm run typecheck` aplicación/tests
correcto. Logs `/tmp/savepoint-fe02-red.log`, `/tmp/savepoint-fe02-directed.log`,
`/tmp/savepoint-fe02-full.log`, `/tmp/savepoint-fe02-types.log`.

Backend no cambió durante FE-02: último corte **165/165** base, **161/161** HTTP
con MongoDB temporal y TypeScript correcto. Sin Atlas, `.env` ni nuevas librerías.
Navegador y contraste se consolidan al terminar FE-03. INT-03 sigue pendiente:
este corte no añade timers de cambio de día ni foco/visibilidad. No se declara
cerrado FE-02 ni VIS-03 antes de revisión.

## Verificación conjunta posterior

La [evidencia del bloque](E2-bloque-progreso-rachas-creacion.md) añade revisión
real de navegador con Express y MongoDB temporal, contraste, teclado y cuatro
anchos, además de la regresión final. Los resultados anteriores corresponden
al corte individual; el ticket sigue pendiente de revisión del usuario.
