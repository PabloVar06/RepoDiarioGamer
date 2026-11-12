# Spec E2 — Backend de metas, progreso y rachas

Fecha: 11 de noviembre de 2026. Estado: **borrador NO aprobado**.

Se autoriza redactar esta spec, no implementar. H1–H9 y la planificación están
aprobados; los contratos y resoluciones propuestos aquí necesitan aprobación
explícita. Los DEBE/NO DEBE describen la implementación futura, no su estado actual.

Fuentes: [AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md),
[PRD](../prd/savepoint.md), [épicas](../backlog/epicas.md),
[backlog de 23 tickets](../backlog/E2-metas-y-rachas.md),
[diagnóstico](../diagnostico.md) y [spec frontend](E2-frontend.md).

## 1. Alcance

- Modelo Meta y creación, lectura, edición y desactivación por videojuego.
- Garantía de una sola meta activa incluso con solicitudes concurrentes.
- Actividad semanal por juego, cumplimiento de horas y días, hitos calculados
  sobre el máximo avance E1 y rachas globales sobre las partidas existentes.
- Corrección acotada del contrato de fecha civil B1 y habilitación de tests B5,
  con aislamiento imprescindible de T5 y errores HTTP centralizados.
- Integración con registro/eliminación de partidas y eliminación de juegos,
  preservando endpoints y respuestas existentes de E1.

No incluye autenticación, edición de partidas, informes históricos de metas,
reactivación, cron, notificaciones, gráficos, tienda, descargas o rankings.
No se reescriben fechas antiguas ni se resuelve toda la deuda del diagnóstico.

## 2. Contradicciones, diferencias y propuestas por aprobar

| ID  | Evidencia / diferencia                                                                                                                                | Propuesta y condición de aprobación                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 | La petición actual dice CRUD; PRD H6/H8 y HU05 describen desactivar, no borrar metas físicamente.                                                     | Interpretar DELETE de meta como desactivación lógica. Si se exige borrado físico, cambiar primero PRD/backlog y sus criterios; no implementar ambos por inferencia.         |
| C02 | PRD conserva PA abiertos; backlog aprobado advierte que su aprobación no los resuelve.                                                                | Las decisiones P02–P07 siguientes son propuestas, no hechos aprobados. No cerrar tickets afectados mientras sigan pendientes.                                               |
| C03 | Encabezados de PRD/épicas aún dicen pendiente/para revisión, aunque la conversación y el backlog registran su aprobación.                             | Usar la aprobación explícita de la conversación para H1–H9; no tratarla como aprobación de estas specs. No se editan otras fuentes en esta tarea.                           |
| C04 | Código actual admite fecha/hora y la normaliza; H1/H3 y B1 exigen solo día local de inicio.                                                           | La entrada nueva de partidas exigirá fecha civil estricta. Es un cambio del contrato de escritura actual y requiere aprobación consciente; no migrar documentos existentes. |
| C05 | T3 difiere errores del parser y T5 difiere configuración; una spec que exige 400 para JSON inválido y tests sin `.env` necesita parte de ambos.       | Adelantar solo clasificación del parser/orden de observabilidad y desacoplamiento de la fábrica de app. No declarar toda T3/T5 resuelta.                                    |
| C06 | “Mejor racha” podría interpretarse como récord irreversible; H4 aprobado la recalcula sobre historial existente, incluso tras borrar partidas/juegos. | Mantener la interpretación aprobada: puede disminuir al eliminar datos; no persistir un récord inmutable.                                                                   |

### Resolución propuesta de puntos abiertos

| Referencia | Propuesta de esta spec                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PA01       | Mantener pendiente la ficha académica ausente; no afirmar equivalencia con sus ocho huecos.                                                                                                                                                                                                                                                                                    |
| P02 / PA02 | Rechazar fechas nuevas futuras respecto a hoy en Guayaquil; aceptar cualquier día pasado de calendario válido en años 0001–9999, sin límite adicional. Para registros futuros ya existentes, proponer excluirlos de actividad semanal/rachas hasta llegar a su día; conservarlos en historial y no alterar silenciosamente el resumen E1. Esta distinción requiere aprobación. |
| P03 / PA03 | Guardar metas inactivas sin vista histórica ni reactivación. Crear otra genera otro ID. Al borrar un juego, borrar también sus metas activas/inactivas, además de sus partidas. Extensión explícita de cascada, no garantía nueva de atomicidad entre colecciones.                                                                                                             |
| P04 / PA04 | Descripción de hito obligatoria, recortada y de 1–120 caracteres; porcentaje entero 1–100. Permitir objetivos y descripciones repetidos porque el PRD no exige unicidad; identificarlos por ID.                                                                                                                                                                                |
| P05 / PA05 | API y persistencia usan minutos enteros como valor canónico. La interfaz recoge horas y minutos; formato visible y redondeo se detallan en frontend. La lógica no redondea.                                                                                                                                                                                                    |
| P07 / PA07 | Leer las fechas antiguas tal como están guardadas y usar su componente de día UTC, sin intentar recuperar el inicio local original. No migrar. Datos inválidos deben producir diagnóstico controlado, no ser corregidos en una lectura.                                                                                                                                        |

PA06 y alcance visual se resuelven en la spec frontend. Una aprobación parcial
DEBE indicar expresamente qué contratos y propuestas quedan autorizados.

## 3. Reglas DEBE / NO DEBE

1. DEBE conservar routes → controllers → services → modelos y el prefijo `/api`.
2. DEBE usar `America/Guayaquil` para obtener hoy y semana lunes–domingo. NO DEBE
   depender del TZ del proceso ni convertir una fecha civil UTC al día anterior.
3. DEBE atribuir toda la duración al día local de inicio declarado por el usuario,
   incluso al cruzar medianoche o semana. NO DEBE pedir ni inventar horas de inicio/fin.
4. DEBE permitir metas en cualquier estado del videojuego, incluido Completado
   y Abandonado. NO DEBE desactivar una meta por cambiar el estado del juego.
5. DEBE comparar minutos y días sin redondeo, sumar todas las sesiones válidas
   y contar días distintos por juego. NO DEBE confundir días semanales con racha global.
6. DEBE devolver porcentaje de horas real, incluso mayor de 100, y exigir horas
   Y días para cumplimiento. Sin meta DEBE devolver valores no aplicables como null.
7. DEBE conservar el máximo avance E1 y calcular hitos sobre ese máximo; NO DEBE
   transformar logros manuales en hitos ni guardar “alcanzado” como estado permanente.
8. DEBE contar fechas únicas de todos los juegos para rachas. Si la última es
   hoy o ayer, mantiene la secuencia que termina allí; si es anterior, actual = 0.
   Mejor racha = máximo de todo el historial válido, incluso sin meta.
9. DEBE recalcular al consultar después de altas/bajas, incluidas retroactivas.
   NO DEBE necesitar cron ni almacenar totales que puedan quedar desactualizados.
10. DEBE bloquear creación concurrente de dos metas activas mediante restricción
    de base de datos; comprobar previamente con find NO basta.
11. NO DEBE permitir modificar dueño, identidad, timestamps, estado activa ni
    campos calculados desde los DTO de creación/edición.
12. NO DEBE leer/modificar `.env`, conectar pruebas a Atlas ni cargar dotenv de
    forma indirecta. NO DEBE implementar esta spec antes de su aprobación.

## 4. Modelo Meta y persistencia propuesta

| Campo                      | Contrato                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `_id`                      | ObjectId generado; en JSON string hexadecimal de 24 caracteres.                                     |
| `videojuego`               | Referencia obligatoria e inmutable a Videojuego existente.                                          |
| `minutosObjetivo`          | Número entero obligatorio entre 1 y 6000; equivale a horas >0 y ≤100 con granularidad de un minuto. |
| `diasPorSemana`            | Número entero obligatorio 1–7.                                                                      |
| `hitos`                    | Arreglo de 0–5 subdocumentos; al crear puede omitirse y usar [].                                    |
| `hitos._id`                | ID generado y estable; conservar al editar hitos existentes.                                        |
| `hitos.descripcion`        | Según P04: string recortado de 1–120 caracteres.                                                    |
| `hitos.porcentajeObjetivo` | Según P04: entero 1–100.                                                                            |
| `activa`                   | Booleano administrado por servidor: true al crear, false al desactivar.                             |
| `createdAt`, `updatedAt`   | Timestamps automáticos; no representan la semana de la meta.                                        |

Se propone un índice único sobre `videojuego` restringido a documentos
`activa = true`. Permite varias inactivas sin admitir dos activas para el mismo
juego. Un índice único parcial aplica su unicidad solo a los documentos que
satisfacen el filtro: [documentación de MongoDB](https://www.mongodb.com/docs/manual/core/index-unique/#unique-partial-indexes).

La implementación DEBE verificar que el índice existe antes de aceptar escrituras
de metas. Si no puede crearse o hay duplicados previos, DEBE fallar claramente;
NO DEBE borrar/normalizar datos para hacer que el índice pase. El error de clave
duplicada de este índice se transforma en 409. NO se propone un índice único
sobre `(videojuego, activa)`, que también limitaría incorrectamente las inactivas.

Para modificar/desactivar una meta se propone una escritura condicional a su
estado activo, evitando read-modify-save que reactive una meta concurrentemente
desactivada. No se introduce un sistema general de versionado u optimistic locking.

## 5. Contratos HTTP propuestos

Estas rutas son nuevas propuestas de contrato, no endpoints ya implementados.

| Método y ruta                       | Entrada             | Éxito                                                                                                |
| ----------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| POST `/api/metas`                   | CrearMeta           | 201, MetaDTO.                                                                                        |
| GET `/api/metas/:id`                | ID meta             | 200, MetaDTO activa o inactiva. No es un listado histórico.                                          |
| GET `/api/videojuegos/:id/meta`     | ID juego            | 200, `{ meta: MetaDTO o null }`; juego existente sin activa no es 404.                               |
| PUT `/api/metas/:id`                | EditarMeta          | 200, MetaDTO; solo meta activa.                                                                      |
| DELETE `/api/metas/:id`             | ID meta             | 204 sin cuerpo; desactivación lógica C01. Repetir sobre una inactiva existente también devuelve 204. |
| GET `/api/videojuegos/:id/progreso` | ID juego            | 200, ProgresoJuegoDTO con o sin meta activa.                                                         |
| GET `/api/rachas`                   | Sin filtro de juego | 200, RachasDTO global.                                                                               |

NO hay filtros de semana arbitraria, ID de usuario, reactivación, borrado físico
de meta por endpoint ni endpoints de edición de partidas. Las rutas anidadas
se registran sin interferir con `/api/videojuegos/:id` y su resumen E1.

### DTO de escritura

| DTO        | Campos permitidos y comportamiento                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CrearMeta  | `videojuego`, `minutosObjetivo`, `diasPorSemana`, `hitos` opcional. Cada hito nuevo tiene descripción/porcentaje, sin ID del cliente.                                                                                                |
| EditarMeta | `minutosObjetivo`, `diasPorSemana` obligatorios; `hitos` opcional. Si se omite, conservar los actuales; si se envía, reemplazar la lista completa, conservando IDs conocidos y generando IDs para entradas nuevas. [] elimina todos. |

Un ID de hito enviado en edición DEBE pertenecer a esa meta; un ID ajeno,
repetido en la lista o mal formado es 400 y NO muta la meta. Campos desconocidos,
tipos coercibles pero incorrectos (por ejemplo números como texto), null, NaN,
Infinity, booleanos por números o cuerpo que no sea objeto se rechazan con 400.
Si una edición afecta hitos y objetivos, se valida y guarda el documento completo
en una sola escritura; no hay actualización parcial visible de esa meta.

### DTO de lectura

Todos los IDs son strings; timestamps son ISO UTC. Fechas civiles son YYYY-MM-DD.
MetaDTO expone los campos del modelo anterior; no expone propiedades de Mongoose.

| DTO              | Campos y significado                                                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ProgresoJuegoDTO | `videojuego` (ID), `zonaHoraria` = America/Guayaquil, `fechaLocalActual`, `semana` con `inicio`/`fin` civiles inclusivos, `minutosSemana`, `horasSemana`, `diasJugados`, `porcentajeAvanceActual`, `meta` (MetaDTO o null), `porcentajeHoras` (number o null), `metaCumplida` (boolean o null), `hitos` evaluados. |
| HitoEvaluado     | `_id`, `descripcion`, `porcentajeObjetivo`, `alcanzado` (boolean).                                                                                                                                                                                                                                                 |
| RachasDTO        | `ambito` = global, `zonaHoraria`, `fechaLocalActual`, `rachaActual` y `mejorRacha` (enteros no negativos).                                                                                                                                                                                                         |

Sin meta, ProgresoJuegoDTO conserva la actividad y avance, devuelve `meta: null`,
`porcentajeHoras: null`, `metaCumplida: null` e `hitos: []`. Con meta y sin partidas,
devuelve actividad/avance 0, porcentaje de horas 0, cumplimiento false y hitos
pendientes. `horasSemana = minutosSemana / 60`; el porcentaje no se trunca/redondea
en la lógica ni se limita a 100. La UI decide su formato aprobado.

La respuesta de progreso NO incluye una racha por juego. Las rachas se consultan
por separado y se etiquetan globales. Si dos respuestas se obtienen durante el
cambio de día, la UI DEBE detectar las fechas distintas y reconsultar el conjunto.

## 6. Funciones puras e interfaces internas

Los nombres siguientes son interfaces previstas, no código creado. Las funciones
puras reciben valores simples y no dependen de Mongoose, Express, React,
variables de entorno ni del reloj global. NO mutan sus entradas.

| Función prevista           | Entrada → salida / responsabilidad                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `obtenerFechaLocal`        | Instante de referencia explícito y zona fija → fecha civil actual. No llama a Date.now internamente.            |
| `obtenerSemana`            | Fecha civil actual → lunes y domingo de esa semana, incluso entre meses/años.                                   |
| `calcularActividadSemanal` | Partidas normalizadas del juego + límites de semana + hoy → minutos y fechas distintas según P02.               |
| `calcularCumplimiento`     | Actividad + meta activa o null → porcentaje de horas/cumplimiento o null. Compara minutos y días sin redondear. |
| `evaluarHitos`             | Hitos + máximo avance acumulado E1 → estados derivados.                                                         |
| `calcularRachasGlobales`   | Fechas de todas las partidas + hoy → actual/mejor, deduplicando y ordenando días de calendario.                 |

Los servicios DEBEN obtener una referencia temporal una sola vez por solicitud,
consultar documentos y transformarlos a datos simples para estas funciones.
El avance máximo incluye todas las partidas del juego conforme a E1, no solo
la semana. La racha consume todas las partidas válidas globales, no las de una meta.
Los controladores solo traducen entrada/salida y propagan errores a `next`.

## 7. Fechas, límites y consistencia

- Validar calendario real, no solo regex: rechazar 2026-02-30, fecha vacía o
  timestamp donde se exige día. El 29 de febrero solo existe en año bisiesto.
- Distinguir día almacenado en UTC de hoy obtenido en Guayaquil. Semanas
  cruzando mes/año se calculan por calendario, no por cadenas de mes/día.
- Una sesión domingo 23:30–lunes 01:00 pertenece íntegramente al domingo que
  el usuario selecciona; no se intenta verificar esas horas inexistentes en el modelo.
- Según P02, excluir registros futuros antiguos de actividad/rachas; según P07,
  no reescribir fechas ni corregirlas a partir del TZ del servidor. Un dato legado
  no interpretable provoca 500 controlado y diagnóstico sin exponer documentos privados.
- Varias sesiones el mismo día suman duración, pero cuentan una fecha en días
  semanales y una fecha global en rachas. Borrar una no elimina el día si queda otra.
- Racha actual: termina hoy o ayer; si ayer no tuvo actividad y hoy sí, comienza
  una nueva racha de 1. Mejor racha nunca es menor que actual.
- Eliminar una sesión puede reducir horas, máximo avance, hitos y ambas rachas.
  Desactivar una meta no elimina ninguna de esas fuentes.
- Según P03, extender la cascada del juego a Meta. No se promete atomicidad
  general de la cascada actual ni resolver D3. Su riesgo concurrente debe constar
  en la evidencia; no se reutiliza para debilitar la unicidad de meta activa.

## 8. Errores HTTP y observabilidad

Formato común: objeto con `error` (mensaje en español) y `requestId` (string).
Para errores de campo se propone `detalles` opcional: lista con `campo` y
`mensaje`, usando rutas como `hitos.0.descripcion`. NO incluir valores sensibles,
stack, consultas ni detalles de infraestructura en la respuesta.

| HTTP | Situación                                                                                                                  | Efecto                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 400  | ID mal formado; tipos/rangos/cuerpo/campos inválidos; fecha inválida o futura según P02; JSON malformado.                  | Sin escritura. Para validaciones de campo, detalles cuando sea posible. |
| 404  | Juego referenciado o meta inexistentes.                                                                                    | Sin escritura; juego inexistente no se presenta como “sin meta”.        |
| 409  | Ya existe meta activa, incluido fallo concurrente del índice; intentar editar una inactiva o desactivada concurrentemente. | Mantener documento previo; cliente reconsulta.                          |
| 413  | Cuerpo supera el límite del parser ya configurado.                                                                         | Rechazar sin procesar ni presentarlo como 500.                          |
| 500  | Fallo inesperado/infraestructura o dato legado no interpretable.                                                           | Mensaje genérico con requestId, diagnóstico del servidor sin secretos.  |

Se propone colocar requestId/logger antes del parser y reconocer sus errores
sin duplicar middleware de errores en cada router (alcance C05/T3). Un 204 NO
DEBE contener JSON. No se transforma un 404, 409 o error de red en un éxito vacío.
Los fallos de índice/configuración del arranque impiden aceptar escrituras;
NO se simula que la garantía existe con un test exclusivamente mockeado.

## 9. Tests, criterios y verificaciones

Propuesta de infraestructura: `node:test` con soporte TypeScript de `tsx` ya
presente para unitarios; tests HTTP con aplicación aislada y MongoDB local
descartable para integración. No depende de Atlas ni de credenciales privadas.
El runner debe recibir una base de pruebas explícita y única; solo limpia esa
base y nunca infiere la de desarrollo/producción. La disponibilidad de MongoDB
descartable es requisito del runner, no algo que esta redacción haya probado.

Para impedir carga indirecta de dotenv, proponer `crearApp(configuracion)` sin
importación de `config/env.ts`; el punto de entrada de producción entrega la
configuración. Los tests no importan `index.ts` ni ejecutan el servidor productivo.
Este cambio pertenece a HAB-01/T5 y NO se implementa en esta tarea.

| ID      | DADO / CUANDO / ENTONCES                                                                                                                                     | Verificación futura                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| BE-AC01 | DADO semana 09–15/11/2026, CUANDO hay partidas el 08, 09, 15 y 16, ENTONCES se incluyen 09/15 según H1 y el día de inicio no cambia.                         | AC01/AC02; funciones puras y contrato de partidas.                                    |
| BE-AC02 | DADO 420 minutos en dos fechas y meta 300 minutos/3 días, CUANDO consulto, ENTONCES horas 7, porcentaje 140 y cumplimiento false.                            | AC03/AC04; unitario y HTTP.                                                           |
| BE-AC03 | DADO partidas en juegos diferentes el 09 y 10, CUANDO hoy es 11, ENTONCES actual 2; al consultar el 12 sin actividad el 11, actual 0 y mejor 2.              | AC05; reloj inyectado y distintos TZ de proceso.                                      |
| BE-AC04 | DADO ninguna meta/partida, CUANDO consulto progreso/rachas, ENTONCES ceros observados, rachas 0 y campos no aplicables null.                                 | AC11; no confundir juego inexistente 404 con meta ausente 200.                        |
| BE-AC05 | DADO dos POST concurrentes del mismo juego, CUANDO compiten por crear meta, ENTONCES uno devuelve 201 y otro 409 y queda una sola activa.                    | AC07/AC08; MongoDB real descartable con índice creado.                                |
| BE-AC06 | DADO límites 1/6000 minutos y 1/7 días, CUANDO creo/edito, ENTONCES los extremos válidos pasan y fuera de rango/tipos incorrectos no escriben.               | AC07; tabla de casos negativos y metas de juegos Completado/Abandonado AC12.          |
| BE-AC07 | DADO meta a mitad de semana, CUANDO creo/edito/desactivo, ENTONCES incluye actividad previa, recalcula y conserva partidas; crear otra deja solo una activa. | AC08/AC09; repetir DELETE e intentar PUT inactivo.                                    |
| BE-AC08 | DADO avances 80/30/70 y hito 75, CUANDO elimino la única sesión 80, ENTONCES máximo 70 e hito pendiente, sin cambiar logros manuales.                        | AC10; servicio, HTTP y regresión de resumen E1.                                       |
| BE-AC09 | DADO fechas repetidas/retroactivas, CUANDO elimino una partida o juego, ENTONCES rachas se recalculan y un día con otra partida se conserva.                 | AC06; incluir mejor racha que disminuye tras borrar.                                  |
| BE-AC10 | DADO petición inválida, JSON roto, duplicado o fallo de DB, CUANDO se procesa, ENTONCES HTTP y requestId cumplen la tabla y no hay éxito ficticio.           | Contratos 400/404/409/413/500; ausencia de mutaciones en rechazos.                    |
| BE-AC11 | DADO carreras PUT/DELETE de meta, CUANDO desactivación gana primero, ENTONCES PUT no reactiva ni edita la inactiva y devuelve 409.                           | Integración con escrituras condicionales; si PUT ganó antes, DELETE termina inactiva. |

Debe añadirse cobertura de año bisiesto, cambio de año, domingo/lunes, múltiples
inactivas, ID de hito ajeno/repetido, [] frente a omisión de hitos y orden de
respuestas. AC13 requiere regresión de E1; los tests del harness no la sustituyen.

Comandos de cierre previstos, aún inexistentes hasta HAB-01: `npm run test:unit`
y `npm run test:integration` en backend; `tsc --noEmit` es complementario. Su
implementación y scripts no se afirman presentes ni ejecutados hoy.

## 10. Tabla ticket → archivos previstos

N = nuevo, M = modificar, durante la implementación aprobada. Solo las rutas
de pruebas/configuración son propuestas; no se crean archivos de aplicación ahora.

| Ticket                 | Archivos previstos                                                                                                                                                                                                                                                                                                                                                                    | Alcance / evidencia                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| E2-HAB-01 (parte BE)   | M `backend/package.json`, lockfile, `src/app.ts`, `src/index.ts`; N `backend/tests/setup.ts`, `tests/app.test.ts`                                                                                                                                                                                                                                                                     | Runner, app inyectable y datos aislados; mantener `config/env.ts` fuera del grafo de tests. |
| E2-HAB-03              | M `backend/src/modelos/Partida.model.ts`, `src/services/partidas.service.ts`; N `src/services/fechas.ts`, `tests/fechas.test.ts`                                                                                                                                                                                                                                                      | B1 y P02/P07 si se aprueban.                                                                |
| E2-BE-01               | N `backend/src/services/progreso.calculos.ts`, `src/services/progreso.service.ts`, `src/controllers/progreso.controller.ts`, `tests/progreso.test.ts`; M `src/routes/videojuegos.routes.ts`                                                                                                                                                                                           | Actividad semanal sin meta.                                                                 |
| E2-BE-02               | N `backend/src/services/rachas.calculos.ts`, `src/services/rachas.service.ts`, `src/controllers/rachas.controller.ts`, `src/routes/rachas.routes.ts`, `tests/rachas.test.ts`; M `src/app.ts`                                                                                                                                                                                          | Consulta global con reloj explícito.                                                        |
| E2-BE-03               | N `backend/src/modelos/Meta.model.ts`, `src/routes/metas.routes.ts`, `src/controllers/metas.controller.ts`, `src/services/metas.service.ts`, `tests/metas.test.ts`, `tests/metas.concurrente.test.ts`; M `src/app.ts`, `src/index.ts`, `src/routes/videojuegos.routes.ts`, `src/services/progreso.service.ts`, `src/services/progreso.calculos.ts`, `src/middlewares/errorHandler.ts` | CRUD inicial, índice y 409; inicialización del índice antes de escrituras.                  |
| E2-BE-05               | M `backend/src/services/metas.service.ts`, `src/controllers/metas.controller.ts`, `src/routes/metas.routes.ts`, `tests/metas.test.ts`                                                                                                                                                                                                                                                 | Edición condicional y objetivos.                                                            |
| E2-BE-06               | M `backend/src/services/metas.service.ts`, `src/controllers/metas.controller.ts`, `src/routes/metas.routes.ts`, `tests/metas.test.ts`                                                                                                                                                                                                                                                 | Desactivar y repetir 204, si C01/P03 se aprueban.                                           |
| E2-BE-07               | M `backend/src/modelos/Meta.model.ts`, `src/services/metas.service.ts`, `src/services/progreso.calculos.ts`, `tests/metas.test.ts`; N `tests/hitos.test.ts`                                                                                                                                                                                                                           | Identidad/validación/estado derivado de hitos.                                              |
| E2-INT-01 (parte BE)   | M `backend/src/services/videojuegos.service.ts`; N `backend/tests/recalculo.test.ts`                                                                                                                                                                                                                                                                                                  | Cascada a metas propuesta en P03 y recálculo tras bajas; no inventar atomicidad general.    |
| E2-INT-03 (soporte BE) | M `backend/tests/rachas.test.ts`, `tests/progreso.test.ts`                                                                                                                                                                                                                                                                                                                            | Valores al consultar con nuevo día, sin tarea programada.                                   |
| E2-INT-04 (parte BE)   | N/M `backend/tests/*.test.ts` vinculados arriba                                                                                                                                                                                                                                                                                                                                       | Matriz AC01–AC13 por bloques y regresiones del producto.                                    |

T3 adelantado de C05 afecta `backend/src/app.ts` y `src/middlewares/errorHandler.ts`
en los tickets HAB-01/BE-03 con evidencia HTTP; su alcance debe registrarse, no
ocultarse como parte del formato. El resto de T1–T5/D1–D3 sigue pendiente.

## 11. Restricciones y aprobación

- NO escribir código, instalar dependencias ni ejecutar DB al redactar esta spec.
- NO introducir una capa nueva que sustituya la arquitectura existente ni
  refactorizar todos los servicios por conveniencia.
- NO prometer snapshots transaccionales entre endpoints o atomicidad nueva de
  toda la cascada; precisar riesgos reales y no cerrar tests concurrentes con mocks.
- DEBE coordinarse el mismo contrato con frontend antes de implementar cualquiera.
- DEBE ejecutar tests pertinentes y revisar criterios/ticket/archivos antes del cierre.
- NO hacer staging, commit, push ni despliegue sin instrucción independiente.

**Aprobación: pendiente.** Revisar C01–C06 y P02/P03/P04/P05/P07 junto con P06 y
alcance visual de la spec frontend. Si se cambia una resolución, actualizar los
dos contratos afectados y solicitar aprobación antes de programar.

**Evidencia actual:** únicamente redacción y revisión documental. Las pruebas
anteriores son verificaciones exigidas para la implementación futura, no ejecutadas.
