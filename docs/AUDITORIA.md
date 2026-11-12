# Auditoría de SAVEPOINT — E1, E2 y Nebula Arcade

Fecha: **12 de noviembre de 2026**, America/Guayaquil.
Código auditado y cierre versionados en
**242135f46809e22ed1deac12e4c05270ff2e891d**:
`feat: completar E2-FE-01 y E2-VIS-02 y cerrar E2-INT-04`.
El bloque se desarrolló sobre 0018a1b y se incorporó por invocación manual de la
skill commit el 12 de noviembre de 2026 a las 10:21:45, America/Guayaquil.
Estado: **auditoría y cierre técnico del alcance aprobado verificados y
commiteados**. No se aprueba ni ejecuta despliegue; no se hizo push.
Esta actualización posterior modifica únicamente auditoría y bitácora,
sin staging ni nuevo commit y sin volver a ejecutar pruebas de producto.

## 1. Fuentes, autorización y evolución de resultados

Se consultaron AGENTS.md, la skill savepoint-sdd, DESIGN.md, diagnóstico,
[PRD](prd/savepoint.md), [épicas](backlog/epicas.md),
[backlog](backlog/E2-metas-y-rachas.md), ambas specs aprobadas, código, tests,
evidencias e historial local. La primera auditoría detectó FE-AC11, FC01 y
notas documentales obsoletas: entonces specs22/23 y PRD12/13 cumplían, F279 y
N25 pasaban y no se modificó código. Esa fotografía no acreditaba cierre.

Después el usuario pidió terminar los tickets abiertos y aprobó el plan de
cierre mediante «aprobado»: completar obtener/activa, el resto VIS-02,
consolidar VIS-01/03 e INT-04, revisar cada DoD y actualizar notas de estado.
Se implementaron únicamente metasApi.ts y presentación/estados en App.tsx,
con pruebas primero. Las reglas de negocio y contratos aprobados no cambiaron.
[Registro individual de los 21 cierres](verificaciones/E2-cierre-tickets.md).

Resultado actual: **23/23 criterios de specs y 13/13 del PRD CUMPLE dentro del
alcance aprobado**, incluidos P-VIS y sus exclusiones explícitas de deudas E1.
Se registran 23 tickets cerrados (dos previos y 21 del bloque autorizado).
PA01, despliegue real, T1/T2/T4/resto T5, D1–D3 y diez archivos heredados de
formato permanecen visibles; no se afirma que toda expectativa de DESIGN fuera
de P-VIS, como prevenir duplicados E1 diferidos, haya sido implementada.

CUMPLE corresponde al escenario/alcance y evidencia indicada; NO CUMPLE es una
desviación observada; SIN VERIFICAR indica fuente o ejecución insuficiente.
Las matrices contienen exactamente los **11 BE-AC y 12 FE-AC**, una fila por
criterio, y los 13 AC del PRD por separado. No se suman porcentajes duplicados.

## 2. Deuda técnica T1–T5 y problemas del diagnóstico

El diagnóstico es una fotografía histórica: sus referencias de línea y mensajes
«pendiente» no describen por sí solos el código actual. Sus hallazgos no se borran.

| ID  | Descripción e impacto                                                                         | Estado real / corrección                                                                                                                                                                | Criterio y evidencia                                                                                                                                                                             | Decisión, esfuerzo y prioridad orientativos                                                                                     |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| T1  | App.tsx concentra pantallas, estado y animación; dificulta mantenimiento.                     | Parcial: Detalle y componentes E2 extraídos; permanecen Formularios/Lista E1 y Estados en App. No resuelta globalmente.                                                                 | Spec FE §5/11 permite extracción mínima; regresiones F pasan. No hay criterio aprobado para reorganizar toda App.                                                                                | Diferida; esfuerzo medio, prioridad posterior a aceptación. No refactorizar ahora.                                              |
| T2  | Clientes E1 duplican request y pierden status/requestId; inconsistencias de diagnóstico.      | Parcial: baseUrl compartida y ErrorApi tipado en metasApi; los clientes E1 siguen separados.                                                                                            | HAB-05/B3 y tests api/baseUrl; no equivalen a criterio de cliente HTTP único.                                                                                                                    | Diferida; esfuerzo medio, prioridad media. Requiere corte y pruebas E1 propios.                                                 |
| T3  | JSON malformado/escalar daba 500 sin requestId/logger; diagnóstico HTTP incorrecto.           | Corregido el hallazgo acotado C05/T3, en dab0637; no implica auditar cualquier otro error posible.                                                                                      | BE-AC10/spec BE §8 anteriores al cambio; requestId/logger antes de express.json; parse.failed→400, too.large→413. I verifica requestId, ausencia de escrituras y respuestas sin cuerpo recibido. | No repetir corrección. Regresión actual aprobada; mantenimiento de esfuerzo bajo.                                               |
| T4  | Formularios E1 permiten envíos simultáneos; posible duplicación de juegos/partidas.           | Pendiente en E1: submit sin guardia de envío. E2 sí bloquea POST/PUT/DELETE repetidos.                                                                                                  | Inspección FormJuego/FormPartida; FE-AC04 pasa para metas, sin demostrar corrección E1. No existe criterio/test aprobado de corrección general T4.                                               | Diferida; esfuerzo bajo–medio, prioridad alta entre deudas por impacto en datos. Bloqueada su corrección hasta plan autorizado. |
| T5  | Importar app cargaba dotenv y exigía configuración; fallback localhost ocultaba base ausente. | Parcial autorizado: crearApp inyectable sin config/env; tests protegidos; B3 elimina fallback absoluto. Se mantiene configuración productiva separada y su verificación real pendiente. | HAB-01/HAB-05, tests isolation/integration-safety/api. Config/env queda fuera del grafo de tests.                                                                                                | No dar toda T5 por cerrada; esfuerzo medio para el resto, prioridad antes de certificar entorno productivo.                     |

T1/T2/T4/resto T5 no tienen autorización de corrección general en este corte.
D1 (logros), D2 (búsqueda fuera de orden) y D3 (atomicidad/volumen) siguen
diferidos. La eliminación secuencial no promete transacciones; no se reabre su
alcance por ejecutar pruebas normales de cascada.

### Mínimo de dos problemas corregidos: trazabilidad comprobada

Se cumple el mínimo de **problemas del diagnóstico**, con B1/B2 y B3, además
de T3. Esto **no significa dos deudas T1–T5 completamente resueltas**. La
solicitud contempla expresamente fechas y URLs y ordena no repetir arreglos ya
verificados. No se implementa otra deuda para inflar el recuento.

| Hallazgo / ticket                               | Criterio anterior al código                                                   | Test primero y corrección existente                                                                                                                                 | Verificación de esta sesión / commit                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| B1 — E2-HAB-03                                  | BE-AC01/P02/P07 ya presentes en la spec del padre de 59bfc98.                 | Evidencia HAB-03: 13 fallos de calendario/modelo y 19 HTTP antes del arreglo. Servicio/modelo exigen día civil, años 0001–9999 y hoy Guayaquil; sin migración.      | B/I: calendario, tipos, bisiestos, cuatro TZ, futuro y persistencia. 59bfc98.                            |
| B2 — E2-HAB-04                                  | FE-AC01 y contrato YYYY-MM-DD en la spec del padre de 59bfc98.                | Evidencia HAB-04 y logs rojos disponibles: 9 fallos React iniciales y fallo posterior de ISO no canónico. Selector date y utilidad de presentación civil.           | F/N: día declarado conservado en JSON, historial y resumen, cuatro TZ en tests. 59bfc98.                 |
| B3 — E2-HAB-05                                  | Spec FE §4 base completa con /api, anterior a 1e528cb.                        | Evidencia HAB-05: tests sin resolver fallan; luego `/` y `///` reproducen defecto. Resolver común valida base y rechaza configuración antes de fetch.               | F: 26 casos del resolver y clientes E1/E2; N atraviesa proxy /api. 1e528cb. No certifica URL desplegada. |
| T3 — C05, dependencia autorizada de BE-03/FE-03 | BE-AC10/C05 y §8 en el padre de dab0637, aprobación «Autorizado» documentada. | Evidencia dependencias FE-03: cuatro casos rojos, tres de parser y uno de cascada; log rojo conserva 0/4. Se cambia orden de middleware y clasificación del parser. | I: JSON malformado, tres escalares y exceso rechazan sin escritura. B/I/F pasan. dab0637.                |

Fuentes del ciclo: [HAB-03](verificaciones/E2-HAB-03.md),
[HAB-04](verificaciones/E2-HAB-04.md), [HAB-05](verificaciones/E2-HAB-05.md),
[C05/T3](verificaciones/E2-dependencias-FE-03.md).
La ejecución roja pertenece a esos cortes históricos; no se volvió a ejecutar
código antiguo ni se inventa una nueva corrección en esta auditoría.

## 3. Pruebas y comprobaciones finales ejecutadas

Leyenda: **B** backend base/unitarias/dominio; **I** HTTP con MongoDB temporal;
**F** frontend Vitest/RTL/clientes con fetch simulado; **N** Chrome con Express
y MongoDB reales temporales; **H** harness Python.

| Comprobación | Comando / configuración                                  | Pasaron | Fallaron | Omitidas |
| ------------ | -------------------------------------------------------- | ------: | -------: | -------: |
| B            | backend: npm test, permiso HTTP local                    |     165 |        0 |        0 |
| I            | backend: npm run test:integration, siete suites seriales |     162 |        0 |        0 |
| F            | frontend: npm test, 24 archivos                          |     311 |        0 |        0 |
| H            | python3 -B -m unittest discover -s tests/harness -v      |      23 |        0 |        0 |
| N            | CDP en Chrome157.0.8103.51, cuatro anchos                |      49 |        0 |        0 |

**638 resultados de producto** (165+162+311), más H23 y N49. Las cifras Node
incluyen subpruebas según su reporte; no se vuelven a sumar suites dirigidas,
repeticiones o los 32 tests nuevos. Fechas/progreso/rachas puras están en B.

| Comprobación técnica           | Resultado y límite                                                                                                                                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript backend/frontend    | CUMPLE: ambos npm run typecheck, aplicación y tests, salida0.                                                                                                                                                                                      |
| Build backend                  | CUMPLE: npm run build -- --outDir /tmp/savepoint-cierre-build/backend, salida0; no ejecuta index.ts/dotenv.                                                                                                                                        |
| Build frontend                 | CUMPLE: TypeScript + Vite build programático, configFile:false/envFile:false, envDir vacío y VITE_API_URL sintética https://api.example.test/api; React/Tailwind/PostCSS existentes, salida0. No se ejecuta el build normal que puede cargar .env. |
| Bundle frontend                | 52 módulos; HTML0,79kB, CSS15,22kB, JS288,82kB (96,35gzip). Salida /tmp/savepoint-auditoria-build/frontend; sin modificar dist del proyecto.                                                                                                       |
| Formato de archivos del bloque | CUMPLE: Prettier aplicado y comprobado en los archivos nuevos/modificados; enlaces, tablas protegidas, diff y staging previo comprobados.                                                                                                          |
| Formato global                 | NO CUMPLE: diez archivos heredados siguen fuera de estilo; no son una nueva corrección autorizada ni se ocultan por cerrar tickets de otro alcance.                                                                                                |
| Hooks                          | core.hooksPath=.githooks, guard-env salida0, H23/23. Sin commit del proyecto como prueba.                                                                                                                                                          |

Los diez archivos heredados son backend/src/config/env.ts (código, no .env),
controllers/videojuegos.controller.ts, middlewares/logger.ts,
middlewares/requestId.ts, modelos/Videojuego.model.ts, routes/partidas.routes.ts,
backend/tsconfig.json, frontend/src/main.tsx, frontend/tsconfig.json y
frontend/tsconfig.node.json. No fueron modificados por este bloque.

Ciclo actual: FE-01 tuvo 21 fallos antes de añadir los métodos, luego F300/300;
VIS-02 tuvo 9 fallos y 2 aprobadas, luego F311/311. Hubo correcciones de
aserciones de presentación: error de carga ahora es alert y el status cambia
al resolver. Un parche al escenario equivocado causó dos fallos y fue corregido;
no se retiraron casos ni se relajaron reglas. Las dos invocaciones iniciales de
npm test desde raíz no tenían script y no cuentan como tests de producto.
Los logs y la [evidencia individual](verificaciones/E2-VIS-02-cierre.md) lo registran.

La auditoría inicial tuvo tres EPERM en B y dos aserciones de foco antes de
pintar el frame del navegador; sus repeticiones pasaron sin cambiar producto.
Esos intentos históricos no se mezclan con los resultados finales actuales.

### Aislamiento y limpieza

Se mantuvo el runner seguro revisado: mongodb-memory-server-core10.2.3 y
MongoDB7.0.24 en 127.0.0.1, base UUID, puerto/PID/dbPath propios. Verifica URI
sin credenciales, proceso vivo, serverStatus/getCmdLineOpts y conexión antes de
operar. AutoCreate/autoIndex desactivados hasta confirmar identidad; índice de
metas real inicializado y probado. Sin Atlas, fallback externo ni dotenv.

En el cierre se crearon **siete instancias I y una N**, con ocho identidades y
ocho limpiezas registradas. Se comprobó además que los ocho PID ya no existen
y sus directorios fueron eliminados. Chrome y HTTP/Vite propios cerrados.
Las diez instancias de la auditoría inicial también se habían limpiado.
Preloads bloquean .env/variantes y Vite usa configuración explícita/directorio
vacío. No se leen valores privados ni se altera MongoDB de desarrollo.

## 4. Una fila por criterio de la spec backend aprobada

Rutas de tests relativas a backend/tests/. Historia y ticket remiten al backlog;
INT-04 consolida evidencia sin sustituir los criterios de cada corte.

| ID      | Historia / ticket            | Implementación                                                   | Método y evidencia concreta ejecutada                                                                                                                                      | Resultado |
| ------- | ---------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| BE-AC01 | HU01/HU07; HAB-03/04, BE-01  | services/fechas.ts, partidas.service.ts, progreso.calculos.ts    | B fechas/partida.model/progreso + I partidas.fecha.http/progreso.http: 08/16 fuera, 09/15 dentro con reloj apropiado; día civil conservado, límites de calendario/TZ.      | CUMPLE    |
| BE-AC02 | HU03/HU04; BE-03/05          | services/progreso.calculos.ts, progreso.service.ts               | B progreso + I progreso.http: 420 min/2 días frente a 300/3 devuelve 7 h, 140 %, false.                                                                                    | CUMPLE    |
| BE-AC03 | HU02; BE-02                  | services/rachas.calculos.ts, rachas.service.ts                   | B rachas + I rachas.http: 09/10 mantiene 2 el 11, corte del 12 da 0 y mejor 2; cuatro TZ.                                                                                  | CUMPLE    |
| BE-AC04 | HU01/HU02; BE-01/02          | services/progreso.service.ts, rachas.service.ts                  | I progreso.http/rachas.http: juego existente sin meta/partidas, ceros observados y null; inexistente 404.                                                                  | CUMPLE    |
| BE-AC05 | HU03; BE-03                  | modelos/Meta.model.ts, services/metas.service.ts                 | I meta.model/metas.crud: índice parcial real, POST concurrentes 201/409; una sola activa, juegos independientes.                                                           | CUMPLE    |
| BE-AC06 | HU03/HU04/HU06; BE-03/05/07  | modelos/Meta.model.ts, validadores metas.service.ts              | B meta.model/metas + I metas.crud: 1/6000 min, 1/7 días, límites/tipos/campos protegidos, todos los estados E1; rechazos sin escritura.                                    | CUMPLE    |
| BE-AC07 | HU03/HU04/HU05; BE-03/05/06  | services/metas.service.ts, progreso.service.ts                   | I progreso.http/metas.crud y recalculo.flujo: actividad anterior, PUT recalcula; DELETE lógico repetible 204, históricas y partidas conservadas; nueva activa con otro ID. | CUMPLE    |
| BE-AC08 | HU06/HU07; BE-07, INT-01     | services/progreso.calculos.ts, videojuegos.service.ts            | B progreso + I progreso.http/recalculo.flujo: máximo 80 con 30/70, hito 75 alcanzado; al borrar 80 queda pendiente; logros E1 intactos.                                    | CUMPLE    |
| BE-AC09 | HU02/HU07; BE-02, INT-01     | services/rachas.calculos.ts, videojuegos.service.ts              | I rachas.http/recalculo.flujo: retroactividad/bajas, fecha duplicada conservada, mejor racha puede disminuir, cascada y juego ajeno intacto.                               | CUMPLE    |
| BE-AC10 | HU03–HU07; BE-03/C05, INT-04 | app.ts, middlewares/errorHandler.ts, services                    | B app + I e1-crud/metas.crud/progreso.http/rachas.http: 400/404/409/413/500 con requestId; parser no escribe, fallo DB/dato legado no se vuelve éxito vacío.               | CUMPLE    |
| BE-AC11 | HU04/HU05; BE-05/06          | services/metas.service.ts, actualización condicional activa:true | I metas.crud: DELETE ganador obliga PUT→409 sin reactivar; PUT ganador seguido de DELETE deja edición guardada y meta inactiva.                                            | CUMPLE    |

## 5. Una fila por criterio de la spec frontend aprobada

Rutas de tests relativas a frontend/tests/, salvo src/api y src/utils.

| ID      | Historia / ticket                           | Implementación                                                    | Método y evidencia concreta ejecutada                                                                                                                                                                                                | Resultado |
| ------- | ------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| FE-AC01 | HU01/HU07; HAB-04, FE-01                    | App FormPartida/ListaPartidas, utils/fechas.ts, DetalleVideojuego | F partidas-fecha y src/utils/fechas: fecha sin hora/ISO, mismo día en formulario/JSON/historial/resumen y cuatro TZ. N registra 11/11 y verifica resumen.                                                                            | CUMPLE    |
| FE-AC02 | HU03/HU04; FE-01/03/04                      | ProgresoSemanal.tsx                                               | F progreso/meta-crear/meta-editar: texto 140 %, aria/barra 100, pendiente por días; formato es-EC y casos cercanos a 100 sin falso cumplimiento.                                                                                     | CUMPLE    |
| FE-AC03 | HU01/HU02/HU05; FE-01/02/05                 | ProgresoSemanal, RachasGlobales, DetalleVideojuego                | F progreso/rachas/meta-desactivar: null no se presenta 0 %, actividad/avance/rachas y Crear meta permanecen; ceros reales distintos de error. N desactiva y conserva actividad.                                                      | CUMPLE    |
| FE-AC04 | HU03/HU04/HU06; FE-03/04/06                 | MetaForm/HitosEditor, metasApi                                    | F meta-crear/meta-editar/hitos: límites, doble submit único, 400/409/red, detalles/borrador/nodos conservados; N PUT único confirmado en HTTP.                                                                                       | CUMPLE    |
| FE-AC05 | HU05; FE-05                                 | ConfirmarDesactivacion, DetalleVideojuego, metasApi               | F meta-desactivar y src/api/desactivarMetaApi: cancelar/Escape sin DELETE, 204 sin parsear JSON, envío único, GET fallido no repite baja. N diálogo/Tab/Escape/retorno de foco y baja real.                                          | CUMPLE    |
| FE-AC06 | HU06/HU07; FE-06, INT-01                    | HitosEditor/HitosLista/MetaForm                                   | F hitos: IDs conservados, omisión frente a [], cinco como máximo, estados DTO sin checkboxes manuales. N renombra/añade hitos y borra sesión máxima con recálculo real.                                                              | CUMPLE    |
| FE-AC07 | HU02/HU03/HU04; FE-02/03/04                 | DetalleVideojuego/MetaForm, App FormJuego                         | F creación/edición Completado/Abandonado; I todos los estados. N cambia juego con meta a ambos estados mediante UI y verifica meta activa y Editar meta disponible.                                                                  | CUMPLE    |
| FE-AC08 | HU07; INT-01                                | DetalleVideojuego/useProgresoVideojuego, App                      | F reconsulta/progreso/rachas/hitos: altas/bajas recargan conjunto; baja del juego no consulta ID borrado. N registro/baja/historial/cascada y datos ajenos.                                                                          | CUMPLE    |
| FE-AC09 | HU01/HU02/HU07; FE-01/02, INT-03            | useProgresoVideojuego                                             | F progreso/rachas/cambio-periodo: cancelación, respuestas fuera de orden, cambio ID, fechas DTO distintas reconsultan; desfase persistente produce error sin bucle ni datos mezclados.                                               | CUMPLE    |
| FE-AC10 | HU02/HU07; INT-03                           | useActualizacionPeriodo/useProgresoVideojuego                     | F cambio-periodo: medianoche/semana, suspensión, foco/visibilidad agrupados, calendario y StrictMode limpios; N cruza corte Guayaquil y conserva borrador. Sin polling.                                                              | CUMPLE    |
| FE-AC11 | HV01–HV03/HU07; VIS-01/02/03, INT-04        | index.css/Tailwind, App E1 y componentes E2                       | F tokens/biblioteca/formularios-historial-visual y N49: seis vistas a 320/375/768/1440, contraste≥4,829:1, texto≥14, controles≥44, sin legacy/sombra/overflow; teclado y reduce. Alcance P-VIS con exclusiones T4/D1–D3 conservadas. | CUMPLE    |
| FE-AC12 | HU03/HU04/HU05/HU07; FE-01/03/04/05, INT-01 | MetaForm, ConfirmarDesactivacion, hook y estados independientes   | F progreso/rachas/meta-crear/meta-editar/meta-desactivar: carga parcial no oculta E1, borrador persiste, guardado confirmado + GET fallido reintenta solo lectura; N fallo parcial conserva campos.                                  | CUMPLE    |

Resumen de criterios de specs: **23 CUMPLE, 0 NO CUMPLE, 0 SIN VERIFICAR**
en el alcance aprobado. FC01 también se verificó, aunque no tiene un AC propio
en esa tabla. PA01 y DEP01 permanecen SIN VERIFICAR fuera de sus escenarios.

## 6. PRD → historia → ticket → spec → test → código → auditoría

Cada fila conserva el ID del PRD; BE/FE remite a las filas anteriores y sus
tests/código. Los escenarios dirigidos AC04 están probados en ambas capas.

| PRD / decisión  | Historia / tickets E2                        | Spec / evidencia ejecutada                                                                                                             | Resultado |
| --------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC01 / H1,H3    | HU01/HU07; HAB-03/04, BE-01, FE-01           | BE-AC01, FE-AC01: día de inicio y duración completa, sin capturar horas ficticias.                                                     | CUMPLE    |
| AC02 / H1       | HU01; BE-01, FE-01                           | BE-AC01, FE-AC01: extremos lunes/domingo, cuatro TZ y calendario.                                                                      | CUMPLE    |
| AC03 / H2,H3    | HU03/HU04; BE-03/05, FE-03/04                | BE-AC02, FE-AC02: 420/300=140 %, barra 100, faltan días.                                                                               | CUMPLE    |
| AC04 / H3,H4    | HU01/HU02; BE-01/02, FE-01/02                | B/I/F dirigidos: A=30+60 min/1 día, B=15/1; rachas globales 1/1.                                                                       | CUMPLE    |
| AC05 / H4       | HU02/HU07; BE-02, FE-02, INT-03              | BE-AC03, FE-AC10: 09/10→2 el 11, 0 el 12; timer/foco.                                                                                  | CUMPLE    |
| AC06 / H4       | HU02/HU07; BE-02, INT-01/03                  | BE-AC09, FE-AC08: retroactividad, otra sesión conserva día y cascada recalcula.                                                        | CUMPLE    |
| AC07 / H5       | HU03/HU04/HU06; BE-03/05/07, FE-03/04/06     | BE-AC06, FE-AC04/06: objetivos, tipos, cinco hitos, 1–6000 min.                                                                        | CUMPLE    |
| AC08 / H5,H6    | HU03/HU04; BE-03/05, FE-03/04                | BE-AC05/07/11, FE-AC04: concurrencia real, actividad previa, edición recalcula.                                                        | CUMPLE    |
| AC09 / H6,H8    | HU05; BE-06, FE-05                           | BE-AC07, FE-AC05: confirmar/cancelar y crear otra sin perder actividad/históricas.                                                     | CUMPLE    |
| AC10 / H7       | HU06/HU07; BE-07, FE-06, INT-01              | BE-AC08, FE-AC06/08: máximo 80→70 cambia hito75 a pendiente.                                                                           | CUMPLE    |
| AC11 / H8       | HU01/HU02/HU05; BE-01/02/06, FE-01/02/05     | BE-AC04, FE-AC03: sin meta conserva actividad/rachas, null; sin partidas ceros.                                                        | CUMPLE    |
| AC12 / H9,H4    | HU02/HU03/HU04; BE-02/03/05, FE-02/03/04     | BE-AC06, FE-AC07: estados permitidos y cambio real UI conserva meta.                                                                   | CUMPLE    |
| AC13 / E1,H1–H9 | HU07/HV01–HV03; HAB, INT-01/04, VIS-01/02/03 | B/I/F/N regresionan E1; FE-AC11 corregido/verificado en el alcance P-VIS. No equivale a resolver las deudas E1 expresamente diferidas. | CUMPLE    |

PRD: **13 CUMPLE, 0 NO CUMPLE, 0 SIN VERIFICAR** en el alcance aprobado. No se suma con las
specs para calcular porcentaje de producto: comparten pruebas y obligaciones.
La matriz del alcance acordado alcanza sus 13 escenarios; esto no certifica
la equivalencia académica PA01 ni corrige deudas excluidas.

### Contratos, reglas y verificaciones complementarias

| ID de auditoría / referencia | Comprobación                                                                                                                                  | Resultado / acción necesaria                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BC01 — BE §4/5               | Meta requerida por juego, minutos/días/hitos/timestamps; índice parcial, históricas e identidad. B/I meta.model/metas.crud.                   | CUMPLE en escenarios ejecutados; modelos E1 conservados.                                                                                                                 |
| BC02 — BE §5/8               | POST/GET/PUT/DELETE metas, GET juego/meta, GET juego/progreso y GET rachas; 201/200/204 y negativos 400/404/409/413/500.                      | CUMPLE, I. No existe PUT de partida ni reactivación y no se inventan.                                                                                                    |
| FC01 — FE §4                 | Siete métodos crear/obtener/activa/actualizar/desactivar/progreso/rachas exportados.                                                          | CUMPLE: los dos GET se completaron bajo plan aprobado, con 21 tests de rutas/DTO/históricas/null/errores/cancelación. Sin consultas redundantes ni cambio de contrato.   |
| CT01 — PA05                  | Persistencia/API minutosObjetivo entero; UI Horas/Minutos. GET /api/videojuegos/:id/progreso, no /progreso-semanal. Resumen E1 independiente. | CUMPLE contrato interno aprobado B/I/F/N. DESIGN usa horasSemanales como etiqueta conceptual, no alias JSON aprobado.                                                    |
| PA01 — fuente académica      | No se dispone del enunciado/ficha original para cotejar horasSemanales y nombre académico de ruta. H1–H9 y PA02–07 sí aprobados.              | SIN VERIFICAR equivalencia académica externa; obtener fuente antes de afirmarla. No cambiar contrato ni añadir alias por inferencia.                                     |
| E1 — regresión               | Videojuego CRUD/filtro/enums/logros; partidas crear/listar/general/poblado/por juego/borrar; resumen ceros/redondeo/máximo y cascada aislada. | CUMPLE B/I/F; N añade creación/edición/logro/registro/baja y conservación de meta tras cambios de estado. No se certifican los diferidos D1/D2/D3.                       |
| DOC01 — estado documental    | Notas de specs/PRD y estados del backlog actualizados al cierre, distinguiendo fotos históricas.                                              | CUMPLE: solo notas de estado; tablas de contratos/modelo/reglas/criterios y mapa ticket→archivos comprobados sin cambios normativos. Excepciones históricas conservadas. |
| DEP01 — despliegue           | Build y configuración sintética frente a servicio realmente desplegado, CORS, conectividad y variables privadas.                              | SIN VERIFICAR entorno real; los builds pasan, no equivalen a prueba de despliegue. No se inspeccionaron .env.                                                            |

## 7. Auditoría visual real contra DESIGN.md

La primera auditoría midió contraste2,959:1, textos11px y controles16–20px en
formularios/historial E1. Sus capturas y resultados iniciales se conservan en
/tmp/savepoint-auditoria-browser/. Esa desviación se corrigió mediante VIS-02
bajo el plan aprobado; la tabla siguiente refleja el código actual.

| Vista / ticket                   | Anchos actuales  |          Contraste mínimo | Texto mínimo / control mínimo | Resultado                                                                               |
| -------------------------------- | ---------------- | ------------------------: | ----------------------------- | --------------------------------------------------------------------------------------- |
| Biblioteca / VIS-02 corte1       | 320/375/768/1440 |                   4,829:1 | 14px / 44px                   | CUMPLE muestra; h1 32, tokens, sin sombras/legacy en main.                              |
| Crear/editar videojuego / VIS-02 | 320/375/768/1440 |                   4,829:1 | 14px / 44px                   | CUMPLE muestra; campos16, h1 32, panel20/radio, acciones adaptables, sin sombra/legacy. |
| Registrar partida / VIS-02       | 320/375/768/1440 |                   4,829:1 | 14px / 44px                   | CUMPLE muestra; fecha civil/validaciones HTML existentes, campos y mensajes en tokens.  |
| Historial general / VIS-02       | 320/375/768/1440 |                   4,829:1 | 14px / 44px                   | CUMPLE muestra; nombre/enlace y Eliminar accesibles, metadatos legibles, sin legacy.    |
| Detalle E1/E2 / VIS-03           | 320/375/768/1440 |                   4,829:1 | 14px / 44px                   | CUMPLE muestra; resumen separado, semanal/rachas/hitos y acciones reales.               |
| Meta/hitos / FE-03/04/06, VIS-03 | 320/375/768/1440 |                    ≥4,5:1 | ≥14px / ≥44px                 | CUMPLE; estados derivados, cinco hitos, IDs, una primaria por contexto.                 |
| Confirmación / FE-05, VIS-03     | 320/375/768/1440 | Estilos/pruebas del panel | Radio20, controles accesibles | CUMPLE; Cancelar/Tab/Escape/retorno, DELETE204 y sin overflow.                          |

Las 24 muestras de seis vistas no tuvieron scroll horizontal. Los diez colores
coinciden con DESIGN por F/tokens, sin hexadecimales en componentes, sombras o
botones secundarios violetas rellenos. Estados comparten panel Nebula; el
historial tiene acción de registro en vacío y reintento explícito de GET en error.
Focos: Tab real rgb(155,123,255),3px/offset3; navegación activa con aria-current,
diálogo nativo y emulación reduce. Se inspeccionan capturas móvil y escritorio.

Familias/fallbacks aprobados conservados, sin instalar o descargar fuentes ni
librerías. Persisten variables legacy sin uso en las vistas de producción
migradas; no se fabrica un cambio global solo para eliminarlas. No hay tienda,
descargas, reseñas, rankings, notificaciones o gráficos históricos.

El cierre visual es el alcance P-VIS expresamente aprobado: T4 (doble envío E1)
y D1/D2/D3 siguen diferidos. No se afirma cumplimiento incondicional de toda
expectativa de interacción de DESIGN fuera de ese corte. Las muestras no
certifican WCAG completa, todos los mensajes/lectores de pantalla ni navegadores.

## 8. Historial Git, precedencia SDD y seguridad

La auditoría inicial revisó **33 commits de las referencias locales** hasta
0018a1b y sus nombres de archivos. Posteriormente se comprobó el commit de
cierre **242135f**, cuyo padre es 0018a1b: incorpora los 14 archivos preparados
y revisados, con árbol f6badbacc76a5ec837cb49e88a13609713e79b27.
No se reescribió historia ni se consultó el remoto. Los criterios aplicables se
comprobaron en el padre de los commits de implementación, no solo en HEAD.

| Entrega                    | Evidencia en Git / evaluación                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Producto                   | 873d26f incorpora PRD/épicas/backlog antes de los cortes funcionales.                                                                                                                                                                                                                                         |
| Primera spec/HAB-01        | ca734b6 incorpora specs y código inicial de HAB-01 juntos. Excepción histórica: aprobación en conversación, sin commit documental separado anterior. Se conserva y no se oculta.                                                                                                                              |
| Ampliación HAB-01          | b67caa4/25d1daf posteriores; cierre explícito documentado.                                                                                                                                                                                                                                                    |
| HAB-05                     | 1e528cb posterior a specs; se comprobó base /api en la versión anterior.                                                                                                                                                                                                                                      |
| Meta/CRUD/progreso         | 03f8564/a6663ff posteriores a ca734b6; regularización documental y modelo coinciden en 03f8564, pero reglas del modelo/índice ya existían. No se inventa precedencia de la actualización de ese mismo commit.                                                                                                 |
| Cliente/tokens/fechas      | db3efbe/0fedabd/59bfc98 posteriores a specs. 59bfc98 también actualiza notas; contrato civil y criterios ya estaban antes.                                                                                                                                                                                    |
| Recuperación/visual E1     | c28df74/8904efc posteriores a specs; VIS-02 solo corte marco/biblioteca, no todo E1.                                                                                                                                                                                                                          |
| Parser/rachas/creación     | dab0637 posterior a 59bfc98: C05, BE-AC10, rachas y formulario ya especificados; autorización acotada de dependencia registrada.                                                                                                                                                                              |
| Edición/hitos/período      | 0018a1b posterior a specs y dab0637: FE-AC04/05/06/08/10 ya existían.                                                                                                                                                                                                                                         |
| Cierre FE-01/VIS-02/INT-04 | 242135f incorpora los dos GET pendientes, la adaptación visual E1, sus tests y documentación de cierre. Contratos aprobados ya presentes en su padre 0018a1b; las specs solo actualizan notas de estado. Commit manual con hooks habilitados, exactamente 14 archivos revisados; árbol resultante comprobado. |

No se detectan nuevas funcionalidades ajenas a E1/E2 en esos cortes. La revisión
de nombres detecta una excepción previa de alcance: f693c5b, commit de
diagnóstico, incluye cambios de lockfiles que el propio diagnóstico excluía de
su tarea; no se atribuyen a la auditoría ni se retiran/revierten. Reformateos
históricos y evidencia compartida se distinguen de nueva lógica. No se certifica
que cada línea de los 33 commits haya tenido aprobación independiente.

Escaneo heurístico de **242 blobs textuales** en referencias locales: patrones
de claves privadas, tokens de proveedores, URI MongoDB con credenciales y
asignaciones evidentes. Los archivos .env/variantes se excluyeron por nombre
antes de leer contenido, también históricamente. Un hallazgo corresponde a una
URI explícitamente sintética en integration-safety.test.ts: prueba que rechaza
credenciales antes de conectar. No se hallaron credenciales reales con ese
método; no equivale a garantía universal ni audita el contenido excluido.
El archivo de entorno de ejemplo versionado también se excluyó sin leerlo.

## 9. Evidencia disponible y reproducción

Código, suites permanentes y evidencias de cierre versionados en 242135f;
las pruebas citadas se ejecutaron antes de ese commit y sus resultados se
conservan sin atribuirles una nueva ejecución. Evidencia individual en
docs/verificaciones. Logs/capturas de
/tmp son temporales y no se añaden al repositorio ni se prometen tras borrarlos.

| Evidencia final       | Ruta local                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| B/I/F/H               | /tmp/savepoint-cierre-backend.log, -integracion.log, -vis02-green2.log y -harness.log, todos con prefijo /tmp/savepoint-cierre.                     |
| TypeScript/build      | Mismo prefijo: -backend-types.log, -vis-final-types.log, -build-backend.log, -build-frontend.log.                                                   |
| Ciclo FE-01/VIS-02    | Mismo prefijo: -fe01-red.log/-green.log/-types.log y -vis02-red.log/-directed.log/-green.log/-green2.log.                                           |
| N                     | /tmp/savepoint-cierre-browser.log y /tmp/savepoint-cierre-browser/reporte.json; capturas auditoria-_.png/hitos-formulario-_.png/confirmacion-*.png. |
| Scripts temporales    | /tmp/savepoint-cierre-browser.cjs y /tmp/savepoint-auditoria-build.cjs, con preloads protectores.                                                   |
| Integridad documental | /tmp/savepoint-cierre-contratos.json protege tablas aprobadas antes de corregir notas; comparación posterior aprobada.                              |
| Auditoría inicial     | /tmp/savepoint-auditoria-*.log/json, reporte/capturas iniciales y /tmp/savepoint-auditoria-inicial.md; no se mezclan con resultados finales.        |

Formato: /tmp/savepoint-cierre-formato.log (14 archivos del bloque) y
/tmp/savepoint-cierre-formato-global.log (161 archivos, diez heredados pendientes).
El escaneo acotado de los 14 archivos nuevos/modificados no detectó indicios
con los patrones de credenciales revisados; no garantiza ausencia universal.

Huellas SHA-256 de evidencia final:

```text
backend.log b05c2593e2eb905e68506f6252ec98b06a0f2eebe8668b87e81b5b30bb6fd32a
integracion.log 0a43a8bc6624cc4dbd72289a66fba7c5eb6d1e33bfdaced67e413516c248710f
vis02-green2.log d65858a56f7a8626c324fdb27ab6d342b336c8f3b5ea378325e46bf4a0872863
browser.log a65373a71edf6943e56ce0ca9affc843526d39b793b10965e9324a80d04f9ae8
```

Reproducción: los comandos de §3 desde cada directorio conservando preloads y
permisos de puertos locales; integración solo con startTemporaryMongo. Build/N
usan configuración programática sintética con envFile/configFile false y envDir
vacío. Si MongoDB7.0.24 no está disponible y no puede obtenerse, detener I/N sin
alternativa Atlas. Detalles de cada ticket y sus limitaciones en
[E2-cierre-tickets](verificaciones/E2-cierre-tickets.md).

## 10. Tickets, riesgos y preparación para despliegue

Backlog actualizado: **23 tickets cerrados dentro de su alcance aprobado**;
dos tenían cierre previo y 21 se cerraron bajo el plan solicitado/aprobado.
Cada DoD y dependencia tiene fila individual en
[E2-cierre-tickets](verificaciones/E2-cierre-tickets.md). No se cierran por
existencia de código o commit: FE-01/VIS-02 completan sus brechas antes de la
consolidación VIS/INT-04 y la actualización de estados.

Fuera de esos cierres siguen PA01 y comprobación real de despliegue SIN
VERIFICAR, T1/T2/T4/resto T5 y D1–D3, además del formato heredado. También se
conservan falta de snapshot entre GETs, sincronización entre pestañas y retraso
del timer en suspensión. No se prometen transacciones o volumen no probados.

**Preparación general:** implementación y aceptación del alcance técnico
acordado verificadas; lista para revisión del bloque, no para afirmar equivalencia
académica o despliegue productivo ya validado. Obtener la fuente PA01 y planificar
la verificación del entorno real; no leer .env ni cambiar contrato por inferencia.

Archivos de implementación: frontend/src/api/metasApi.ts, frontend/src/App.tsx,
test nuevo de consultas, test nuevo de formularios/historial y ajuste accesible
del test de partida-error. Documentación: auditoría, bitácora, PRD, notas de las
dos specs, backlog y tres evidencias de cierre. Conservarlos para revisión.
No se recomienda preparar /tmp, .env, dependencias, builds o cambios ajenos.
Durante la implementación se conservó el staging previo sin añadir archivos.
Después el usuario preparó los cambios e invocó manualmente la skill commit:
**242135f**, 14 archivos, 1268 inserciones y 253 eliminaciones. Se verificó que
el árbol del commit coincidía exactamente con el staging revisado y que el
árbol de trabajo quedó limpio. La skill no ejecutó git add ni git push.

Las propuestas anteriores de commits separados quedan como planificación
superada por esa invocación manual del usuario. Esta actualización de auditoría
y bitácora todavía está sin preparar ni commitear; no modifica código,
criterios, resultados de pruebas ni pendientes. No se hace push ni despliegue.
