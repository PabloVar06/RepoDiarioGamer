# E2-HAB-03 — Validación y persistencia del día civil de inicio

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: **cerrado con aprobación explícita del usuario** el 12 de noviembre
de 2026. Autorización: «Cierra el ticket y procede al siguiente paso». El usuario
aprobó previamente el plan mediante «Plan aprobado», incluida la transición de
escritura hasta HAB-04. El cierre corresponde al alcance backend del ticket;
la compatibilidad frontend sigue pendiente de HAB-04. Sin staging, commit ni push.

## Alcance y trazabilidad

Fuentes: [AGENTS.md](../../AGENTS.md), [diagnóstico B1](../diagnostico.md),
[backlog](../backlog/E2-metas-y-rachas.md), [PRD AC01](../prd/savepoint.md) y
[spec backend](../specs/E2-backend.md), reglas 2–3, P02/P07 y §7.
La spec y sus reglas ya figuran en Git: ca734b6, actualizadas en 03f8564, antes
de este código. Los cambios documentales del corte anterior permanecen en el
árbol de trabajo; no se crea un commit ni se altera el historial.

- POST `/api/partidas` exige `fecha` string `YYYY-MM-DD`, calendario real y
  años 0001–9999; rechaza timestamps, otros tipos, días imposibles y fechas
  futuras respecto al día de Guayaquil.
- El controlador captura una referencia del reloj inyectable existente por
  solicitud. El servicio valida y persiste un Date interno a medianoche UTC,
  reutilizando `fechaCivilUTC` y `obtenerFechaLocal`, sin duplicar cálculos.
- El modelo valida el calendario antes del cast y admite Date interno solo
  a medianoche UTC. Elimina la conversión `Date.UTC` que alteraba años 0001–0099.
- No hay migración ni corrección en lectura de fechas antiguas, nuevos endpoints,
  cambios al resumen E1, nuevas funcionalidades E2 o cambios frontend.
- La política de futuro se valida al crear mediante el servicio, con el reloj
  de la solicitud; el modelo valida la representación civil sin depender del reloj.

## Tests primero y defectos reproducidos

Antes de modificar los tres archivos de aplicación se añadieron las pruebas:

| Primera ejecución                | Resultado observado                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Calendario y modelo              | 49 tests: 36 pasaron y 13 fallaron; 0 omitidos/cancelados. Los 18 tests previos de calendario forman parte de los 49. |
| HTTP HAB-03 con MongoDB temporal | 32 tests: 13 pasaron y 19 fallaron; 0 omitidos/cancelados. Aislamiento y limpieza comprobados.                        |

Los fallos reprodujeron normalización de días imposibles, aceptación de tipos
incorrectos/timestamps/futuro, falta de uso del reloj en creación y conversión
del Date interno del año 0001 a 1901 y del 0099 a 1999. El helper de calendario
ya existente pasó sus nuevos casos; se reutilizó sin modificarlo.

En las regresiones solo se ajustaron relojes/fixtures afectados: reloj explícito
en E1/CRUD Meta; inserción directa y aislada del dato futuro legado del test de
progreso, en vez de crearlo mediante una API que ahora debe rechazarlo; contador
de reloj reiniciado antes de medir las dos consultas. No se retiraron escenarios
ni se debilitaron las aserciones de contratos.

## Resultados finales ejecutados

Comandos desde backend o frontend según la columna; todos finalizaron con salida 0.

| Verificación                   | Comando                                                                                                                                | Resultado                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| BE dirigido, calendario/modelo | `node --require ./tests/setup.cjs --import tsx --test --test-reporter=tap tests/fechas.test.ts tests/partida.model.test.ts`            | **49/49**, sin fallos/omisiones/cancelaciones.                                                                      |
| BE HTTP dirigido               | `node --require ./tests/integration/preload.cjs --import tsx --test --test-reporter=tap tests/integration/partidas.fecha.http.test.ts` | **32/32**, sin fallos/omisiones/cancelaciones.                                                                      |
| BE unitarias/base completas    | `npm test`                                                                                                                             | **146/146**: 115 previas + 31 nuevas; sin fallos/omisiones/cancelaciones.                                           |
| BE integración completa        | `npm run test:integration`                                                                                                             | **151/151**: 119 previas + 32 nuevas; sin fallos/omisiones/cancelaciones.                                           |
| FE regresiones existentes      | `npm test`                                                                                                                             | **97/97**, seis archivos, sin fallos u omisiones. No son pruebas de compatibilidad HTTP real del formulario actual. |
| BE TypeScript                  | `npm run typecheck`                                                                                                                    | Aplicación y tests correctos: `tsc --noEmit` y `tsc --project tsconfig.test.json`.                                  |
| FE TypeScript                  | `npm run typecheck`                                                                                                                    | Aplicación y tests correctos, sin cambiar archivos frontend.                                                        |

Los tests dirigidos son subconjuntos de las suites completas; no se suman como
pruebas adicionales. Las 151 integraciones incluyen las dos caracterizaciones
de T3 que siguen confirmando 500 sin requestId: no acreditan su corrección.

Prettier `--check` pasó sobre los 17 archivos modificados o nuevos del árbol
(incluidos los documentos del corte anterior). `git diff --check` pasó; staging
permanece vacío. La comparación semántica conservó historias, criterios,
contratos, dependencias y DoD aprobados; los 23 estados están representados y
los enlaces locales del backlog/evidencia resuelven correctamente.

## Criterio → prueba → resultado

| Criterio / alcance                              | Pruebas reales                                                                  | Resultado / límite                                                                                                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC01/H3: conservar día local de inicio          | fechas.test.ts, partida.model.test.ts, partidas.fecha.http.test.ts              | POST guarda exactamente el día declarado; GET general/por juego y resumen lo conservan. Dos sesiones del domingo suman 120 minutos y un día; al comenzar el lunes, no aportan a la nueva semana. No se inventan horas de inicio/fin. |
| P02: calendario, tipos y retroactividad         | Calendario/modelo y tabla negativa HTTP                                         | Años 0001/0099/9999 y bisiestos válidos; inválidos/imposibles/timestamps/tipos incorrectos reciben 400 sin cambiar ninguna partida existente. 9999 se prueba con reloj sintético de ese año.                                         |
| P02: hoy de Guayaquil independiente del proceso | HTTP antes/después de 05:00 UTC y cuatro TZ                                     | El día siguiente recibe 400 hasta el corte exacto, luego 201. UTC, Guayaquil, Tokio y Los Ángeles conservan el día y la política de futuro.                                                                                          |
| Referencia temporal única                       | HTTP de creación                                                                | Una lectura del reloj por POST válido, compartida con la validación del servicio.                                                                                                                                                    |
| P07: legado sin migración                       | Fixture crudo con hora UTC, snapshots y consultas de progreso/resumen/historial | Se mantiene su componente de día UTC; excluido hasta llegar a su día; todos los documentos permanecen idénticos tras las consultas.                                                                                                  |
| Errores y relaciones E1                         | HTTP 400/404 y suites E1/Meta/progreso                                          | Referencias mal formadas/inexistentes conservan 400/404 con requestId y sin escrituras; CRUD, logros, resumen, cascada E1 y datos de otros juegos conservan sus regresiones.                                                         |
| AC01 completo en pantalla                       | Pendiente HAB-04                                                                | No se certifica el selector ni la presentación frontend, fuera de este ticket.                                                                                                                                                       |

## Aislamiento MongoDB y limpieza

Se reutilizó exclusivamente mongodb-memory-server-core 10.2.3 con binario
**MongoDB 7.0.24**. Antes de escrituras el runner verificó proceso hijo propio,
host/puerto, base exclusiva, PID real mediante serverStatus y dbPath mediante
getCmdLineOpts. AutoCreate/autoIndex permanecieron desactivados al conectar.
Cada petición HTTP del nuevo test revalida la conexión; las inserciones crudas
de fixtures también comprueban aislamiento antes de escribir.

La ejecución completa produjo cinco confirmaciones de aislamiento y cinco
confirmaciones de proceso detenido y directorio/datos temporales eliminados:

| Suite         | Host / puerto   | PID   | Base exclusiva                                     | Directorio temporal, terminado en `/data` |
| ------------- | --------------- | ----- | -------------------------------------------------- | ----------------------------------------- |
| E1 CRUD       | 127.0.0.1:54981 | 78698 | savepoint_e1_test_b4e275701e554c36a8c9bb8e98d6eba3 | savepoint-e1-PMBmEg                       |
| Modelo Meta   | 127.0.0.1:55002 | 78734 | savepoint_e1_test_ef178229cedc4f1a98a1663d60b2d892 | savepoint-e1-0YC9aE                       |
| CRUD Meta     | 127.0.0.1:55011 | 78744 | savepoint_e1_test_0c5dee3e474048f8897ab55860cdc1c2 | savepoint-e1-iIpiYl                       |
| Fechas HAB-03 | 127.0.0.1:55024 | 78749 | savepoint_e1_test_ccb32492c1ac43b2a4bf8e05e7fa2f95 | savepoint-e1-gSjrMJ                       |
| Progreso      | 127.0.0.1:55032 | 78754 | savepoint_e1_test_308828efe95e4ffc8e162d9333b81259 | savepoint-e1-bubZCw                       |

El runner comprobó ESRCH del proceso y ENOENT del directorio al cerrar. No se
usaron Atlas, URI externa, credenciales ni archivos `.env`; los preloads bloquean
su lectura y la importación de dotenv. Los permisos de escucha local se
concedieron para las pruebas; no se levantó el servidor de producción.

Logs temporales de esta ejecución, fuera del repositorio:

- `/tmp/savepoint-hab03-unit-red.log` y `/tmp/savepoint-hab03-http-red.log`.
- `/tmp/savepoint-hab03-unit-green.log` y `/tmp/savepoint-hab03-http-green.log`.
- `/tmp/savepoint-hab03-backend-all.log` y `/tmp/savepoint-hab03-integration-all.log`.
- `/tmp/savepoint-hab03-frontend-all.log`.
- `/tmp/savepoint-hab03-backend-typecheck.log` y `/tmp/savepoint-hab03-frontend-typecheck.log`.
- `/tmp/savepoint-hab03-format.log`.

## Archivos del ticket

| Archivo                                                 | Cambio                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `backend/src/controllers/partidas.controller.ts`        | Capturar reloj inyectado una vez y pasarlo al servicio.                                |
| `backend/src/services/partidas.service.ts`              | Validar fecha civil/futuro y persistir la representación UTC sin mutar la entrada.     |
| `backend/src/modelos/Partida.model.ts`                  | Validar representación civil y conservar años; sin normalización de timestamps nuevos. |
| `backend/tests/fechas.test.ts`                          | Nueve casos adicionales sobre el helper existente.                                     |
| `backend/tests/partida.model.test.ts`                   | Nuevo: 22 casos de modelo sin base de datos.                                           |
| `backend/tests/integration/partidas.fecha.http.test.ts` | Nuevo: 32 tests con HTTP y MongoDB temporal.                                           |
| `backend/tests/integration/e1-crud.test.ts`             | Reloj sintético explícito.                                                             |
| `backend/tests/integration/metas.crud.test.ts`          | Reloj sintético explícito.                                                             |
| `backend/tests/integration/progreso.http.test.ts`       | Fixture futuro legado seguro y contador de reloj de consultas.                         |
| `docs/backlog/E2-metas-y-rachas.md`                     | Estado y evidencia de HAB-03; sin cambiar historias, criterios ni dependencias.        |
| `docs/verificaciones/E2-HAB-03.md`                      | Este registro.                                                                         |

Los otros cambios documentales presentes corresponden al corte anterior de
regularización y se conservan. No son implementación adicional de HAB-03.

## DoD y limitaciones

| Condición                                              | Estado                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Spec y plan aprobados antes de implementar             | Cubierto; reglas de la spec ya versionadas.                                                   |
| Tests primero y defecto reproducido                    | Cubierto con los resultados iniciales registrados.                                            |
| Escritura civil, límites y ausencia de desfase backend | Cubierto por unitarias/modelo/HTTP; sin migrar datos.                                         |
| Regresiones E1/E2 y TypeScript                         | Cubierto con suites completas y ambas comprobaciones.                                         |
| Formato, alcance y documentación                       | Cubierto por Prettier, diff, enlaces y comparación de criterios/contratos.                    |
| Aislamiento y limpieza                                 | Cubierto en las cinco instancias temporales de la suite completa.                             |
| Compatibilidad del formulario E1 actual                | Pendiente HAB-04, transición expresamente aprobada; no se declara flujo completo funcionando. |
| Revisión y cierre del ticket                           | Cubierto: cierre expresamente autorizado por el usuario; sin commit automático.               |

**Transición aprobada:** el frontend todavía envía timestamps desde datetime-local;
ahora el backend responde 400 a esos envíos. No se debe desplegar este corte
aisladamente ni afirmar que el formulario de registro funciona hasta completar
HAB-04. B2 y B4 siguen pendientes; no se corrigen interfaz ni recuperación aquí.
T3 y el resto de la deuda/diferidos se conservan; PA01 continúa sin cotejo externo.

Mensaje de commit sugerido, sin ejecutarlo:
`fix: validar fechas civiles en E2-HAB-03`.

## Registro de cierre

Se revisaron los resultados ya ejecutados: 146/146 backend, 151/151 de
integración y 97/97 frontend, TypeScript de ambas capas y formato correctos.
Este cierre solo actualiza documentación; no se repitieron suites ni se modificó
código. Se conservan los resultados y las limitaciones del corte. HAB-04 pasa
a planificación; T3 y la incompatibilidad temporal de envío siguen visibles.
