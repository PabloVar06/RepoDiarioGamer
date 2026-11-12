# E2-BE-02 — racha actual y mejor racha global

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado y verificado; pendiente de revisión del usuario. Autorización:
bloque incremental de pasos 4–6. Dependencias HAB-01/03 implementadas y cerradas;
spec backend aprobada y versionada antes de este código. Sin staging/commit/push.

Fuentes: [backend H4/P02/P07, §§5–7 y BE-AC03/04/09/10](../specs/E2-backend.md),
[backlog BE-02](../backlog/E2-metas-y-rachas.md).

GET `/api/rachas` devuelve exclusivamente ámbito global, zona Guayaquil, fecha
local actual y ambos enteros. El controlador captura el reloj una vez; el
servicio consulta fechas de todas las partidas, transforma el día UTC legado
y delega a `calcularRachasGlobales`. No filtra por juego/estado/meta ni persiste
un récord. No se cambia resumen E1 ni se añade filtro histórico.

| Criterio       | Test / resultado real                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H4 / BE-AC03   | `tests/rachas.test.ts`: hoy/ayer, vacío, huecos, secuencia nueva, mejor sobre historial, deduplicación/orden y recálculo tras borrar.                          |
| H1/H3/P02/P07  | Puras: cruce de año, bisiesto, 0099/0100, futuras excluidas, cuatro TZ y fechas ilegibles. Sin mutación de entradas.                                           |
| AC04           | `integration/rachas.http.test.ts`: dos juegos y tres sesiones en la misma fecha producen 1/1; progreso del juego A conserva 90 minutos/un día.                 |
| AC05/11/12     | HTTP sin partidas/metas; los cuatro estados del juego, meta activa/inactiva/ausente; corte 04:59:59.999Z→05:00Z y mejor racha conservada.                      |
| AC06 / INT-01  | HTTP: otra partida conserva el día; borrar juego reduce rachas y elimina sus metas; otro juego permanece; registro retroactivo vuelve a extender la secuencia. |
| BE-AC10 / AC13 | HTTP 500 controlado ante dato legado ilegible/fallo DB; requestId; resumen intacto y regresión E1 completa.                                                    |

Pruebas primero: la suite pura no cargó por falta del módulo; los ocho casos
HTTP fallaron al no existir la ruta (404). Logs `/tmp/savepoint-be02-red.log`
y `/tmp/savepoint-be02-http-red.log`. En la primera ejecución posterior se
corrigió un fixture de inserción directa que usaba string en vez de ObjectId;
no se cambió E1 para adaptarlo al fixture.

Verificaciones backend: `npm test` **165/165** (19 nuevas puras),
`npm run test:integration` **161/161** (ocho nuevas HTTP),
`npm run typecheck` aplicación/tests correcto. Cero fallos/omitidos al finalizar.
Logs `/tmp/savepoint-be02-unit.log`, `/tmp/savepoint-be02-integration.log`,
`/tmp/savepoint-be02-types.log`.

MongoDB 7.0.24 temporal por suite, 127.0.0.1 y base UUID; PID/dbPath/host/puerto
verificados antes de escrituras/HTTP. Limpieza y parada confirmadas en cada suite.
Sin Atlas ni `.env`. No hay garantías nuevas de snapshot entre GETs, paginación
ni atomicidad de cascada (D3). La UI se verifica en FE-02, no se presume cubierta
por estos tests. El ticket queda pendiente de la revisión del bloque.
